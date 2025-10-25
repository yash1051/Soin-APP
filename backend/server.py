from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import shutil
import base64
import csv
import io
import zipfile

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import Vercel compatibility helpers
try:
    from vercel_compat import get_upload_directory, is_serverless, FILE_STORAGE_WARNING
    UPLOADS_DIR = get_upload_directory()
    IS_SERVERLESS = is_serverless()
except ImportError:
    # Fallback for local development without vercel_compat
    UPLOADS_DIR = ROOT_DIR / 'uploads' / 'tongue_images'
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    IS_SERVERLESS = False
    FILE_STORAGE_WARNING = ""

# MongoDB connection with serverless-friendly settings
mongo_url = os.environ.get('MONGO_URL')
if not mongo_url:
    raise ValueError("MONGO_URL environment variable is required")

# Optimize connection for serverless
client = AsyncIOMotorClient(
    mongo_url,
    maxPoolSize=10 if not IS_SERVERLESS else 1,
    minPoolSize=1,
    maxIdleTimeMS=45000,
    serverSelectionTimeoutMS=5000,
)
db = client[os.environ.get('DB_NAME', 'soin_healthcare')]

# JWT Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

app = FastAPI(
    title="SOIN Healthcare API",
    description="Diabetes management platform with tongue image analysis",
    version="1.0.0"
)
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str  # 'patient', 'doctor', 'admin'
    age: Optional[int] = None
    approval_status: str = "pending"  # 'pending', 'approved', 'rejected' (for doctors)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str
    age: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class Submission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    patient_name: str
    patient_email: str
    patient_age: int
    tongue_image_path: str
    # Diabetes data
    blood_glucose: float
    hba1c: float
    insulin_level: Optional[float] = None
    diabetes_type: str  # 'Type 1', 'Type 2', 'Prediabetes'
    symptoms: List[str] = []  # ['numbness', 'fatigue', 'blurred_vision', etc.]
    medications: List[str] = []  # ['Metformin', 'Insulin', 'Sulfonylureas', etc.]
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubmissionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    patient_id: str
    patient_name: str
    patient_email: str
    patient_age: int
    tongue_image_url: str
    blood_glucose: float
    hba1c: float
    insulin_level: Optional[float]
    diabetes_type: str
    symptoms: List[str]
    medications: List[str]
    notes: Optional[str]
    created_at: datetime

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_role(user: dict, allowed_roles: List[str]):
    if user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    if user["role"] == "doctor" and user.get("approval_status") != "approved":
        raise HTTPException(status_code=403, detail="Your account is pending approval")

# Initialize admin account - works in both serverless and traditional environments
async def ensure_admin_exists():
    """Ensure admin account exists - called on-demand instead of startup"""
    admin_email = "workwithgrover@gmail.com"
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password": hash_password("win40xp"),
            "name": "Admin",
            "role": "admin",
            "approval_status": "approved",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        logging.info("Admin account created")
        return True
    return False

# Health check endpoint that also ensures admin exists
@api_router.get("/health")
async def health_check():
    """Health check endpoint - also ensures admin account exists"""
    try:
        # Check database connection
        await db.command('ping')
        
        # Ensure admin exists (first call will create it)
        await ensure_admin_exists()
        
        return {
            "status": "healthy",
            "database": "connected",
            "environment": "serverless" if IS_SERVERLESS else "local",
            "storage_warning": FILE_STORAGE_WARNING if IS_SERVERLESS else None
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unavailable: {str(e)}")

# Auth routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Ensure admin exists on first call
    await ensure_admin_exists()
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_pw = hash_password(user_data.password)
    user_dict = user_data.model_dump()
    user_dict.pop("password")
    
    user_obj = User(**user_dict)
    doc = user_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['password'] = hashed_pw
    
    # Patients and admin are auto-approved
    if user_data.role in ["patient", "admin"]:
        doc['approval_status'] = "approved"
        user_obj.approval_status = "approved"
    
    await db.users.insert_one(doc)
    
    # Create token
    token = create_access_token({"sub": user_obj.id})
    
    return TokenResponse(
        access_token=token,
        user=user_obj
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    # Ensure admin exists on first call
    await ensure_admin_exists()
    
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Convert datetime strings back
    if isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    user_obj = User(**{k: v for k, v in user.items() if k != 'password'})
    token = create_access_token({"sub": user_obj.id})
    
    return TokenResponse(
        access_token=token,
        user=user_obj
    )

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    if isinstance(current_user['created_at'], str):
        current_user['created_at'] = datetime.fromisoformat(current_user['created_at'])
    return User(**{k: v for k, v in current_user.items() if k != 'password'})

# Submission routes
@api_router.post("/submissions", response_model=SubmissionResponse)
async def create_submission(
    tongue_image: UploadFile = File(...),
    blood_glucose: float = Form(...),
    hba1c: float = Form(...),
    insulin_level: Optional[float] = Form(None),
    diabetes_type: str = Form(...),
    symptoms: str = Form(...),  # JSON string of array
    medications: str = Form(...),  # JSON string of array
    notes: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    # Warning about serverless storage
    if IS_SERVERLESS:
        logging.warning("File uploaded in serverless environment - files will be lost after execution!")
    
    # Save image
    file_ext = tongue_image.filename.split('.')[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = UPLOADS_DIR / file_name
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(tongue_image.file, buffer)
    
    # Parse JSON strings
    import json
    symptoms_list = json.loads(symptoms) if symptoms else []
    medications_list = json.loads(medications) if medications else []
    
    # Create submission
    submission = Submission(
        patient_id=current_user["id"],
        patient_name=current_user["name"],
        patient_email=current_user["email"],
        patient_age=current_user.get("age", 0),
        tongue_image_path=str(file_path),
        blood_glucose=blood_glucose,
        hba1c=hba1c,
        insulin_level=insulin_level,
        diabetes_type=diabetes_type,
        symptoms=symptoms_list,
        medications=medications_list,
        notes=notes
    )
    
    doc = submission.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.submissions.insert_one(doc)
    
    return SubmissionResponse(
        **{k: v for k, v in doc.items() if k != 'tongue_image_path'},
        tongue_image_url=f"/api/images/{file_name}"
    )

@api_router.get("/submissions", response_model=List[SubmissionResponse])
async def get_submissions(current_user: dict = Depends(get_current_user)):
    # Admin and doctors see all, patients see only their own
    query = {}
    if current_user["role"] == "patient":
        query = {"patient_id": current_user["id"]}
    elif current_user["role"] == "doctor":
        await require_role(current_user, ["doctor", "admin"])
    
    submissions = await db.submissions.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    result = []
    for sub in submissions:
        if isinstance(sub['created_at'], str):
            sub['created_at'] = datetime.fromisoformat(sub['created_at'])
        
        file_name = Path(sub['tongue_image_path']).name
        result.append(SubmissionResponse(
            **{k: v for k, v in sub.items() if k != 'tongue_image_path'},
            tongue_image_url=f"/api/images/{file_name}"
        ))
    
    return result

@api_router.get("/images/{filename}")
async def get_image(filename: str):
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path)

# Admin routes
@api_router.get("/admin/pending-doctors")
async def get_pending_doctors(current_user: dict = Depends(get_current_user)):
    await require_role(current_user, ["admin"])
    
    doctors = await db.users.find(
        {"role": "doctor", "approval_status": "pending"},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    
    return doctors

@api_router.post("/admin/approve-doctor/{doctor_id}")
async def approve_doctor(
    doctor_id: str,
    approve: bool,
    current_user: dict = Depends(get_current_user)
):
    await require_role(current_user, ["admin"])
    
    status = "approved" if approve else "rejected"
    result = await db.users.update_one(
        {"id": doctor_id},
        {"$set": {"approval_status": status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    return {"message": f"Doctor {status}"}

@api_router.get("/admin/export-data")
async def export_data(current_user: dict = Depends(get_current_user)):
    await require_role(current_user, ["admin"])
    
    # Get all submissions
    submissions = await db.submissions.find({}, {"_id": 0}).to_list(10000)
    
    # Create ZIP file in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # Create CSV
        csv_buffer = io.StringIO()
        csv_writer = csv.writer(csv_buffer)
        
        # Write header
        csv_writer.writerow([
            'Submission ID', 'Patient Name', 'Patient Email', 'Patient Age',
            'Date', 'Blood Glucose (mg/dL)', 'HbA1c (%)', 'Insulin Level',
            'Diabetes Type', 'Symptoms', 'Medications', 'Notes', 'Image Filename'
        ])
        
        # Write data
        for sub in submissions:
            created_at = sub['created_at']
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at)
            
            file_name = Path(sub['tongue_image_path']).name
            
            csv_writer.writerow([
                sub['id'],
                sub['patient_name'],
                sub['patient_email'],
                sub['patient_age'],
                created_at.strftime('%Y-%m-%d %H:%M:%S'),
                sub['blood_glucose'],
                sub['hba1c'],
                sub.get('insulin_level', 'N/A'),
                sub['diabetes_type'],
                ', '.join(sub.get('symptoms', [])),
                ', '.join(sub.get('medications', [])),
                sub.get('notes', ''),
                file_name
            ])
            
            # Add image to ZIP
            img_path = Path(sub['tongue_image_path'])
            if img_path.exists():
                zip_file.write(img_path, f"images/{file_name}")
        
        # Add CSV to ZIP
        zip_file.writestr('submissions_data.csv', csv_buffer.getvalue())
    
    zip_buffer.seek(0)
    
    # Save to temp file and return
    export_path = ROOT_DIR / 'uploads' / 'export.zip'
    with open(export_path, 'wb') as f:
        f.write(zip_buffer.getvalue())
    
    return FileResponse(
        export_path,
        media_type='application/zip',
        filename=f'soin_export_{datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")}.zip'
    )

@api_router.get("/admin/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    await require_role(current_user, ["admin"])
    
    total_patients = await db.users.count_documents({"role": "patient"})
    total_doctors = await db.users.count_documents({"role": "doctor", "approval_status": "approved"})
    pending_doctors = await db.users.count_documents({"role": "doctor", "approval_status": "pending"})
    total_submissions = await db.submissions.count_documents({})
    
    return {
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "pending_doctors": pending_doctors,
        "total_submissions": total_submissions
    }

app.include_router(api_router)

# Configure CORS
cors_origins = os.environ.get('CORS_ORIGINS', '*')
origins_list = [origin.strip() for origin in cors_origins.split(',')]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Log environment info
if IS_SERVERLESS:
    logger.info("Running in SERVERLESS mode")
    if FILE_STORAGE_WARNING:
        logger.warning("File storage is ephemeral in serverless environment")
else:
    logger.info("Running in LOCAL mode")

# Cleanup (for non-serverless environments)
if not IS_SERVERLESS:
    @app.on_event("shutdown")
    async def shutdown_db_client():
        client.close()
        logger.info("Database connection closed")