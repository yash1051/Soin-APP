from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from pymongo import MongoClient
from passlib.context import CryptContext
import os

# Initialize FastAPI app
app = FastAPI(
    title="Soin API",
    description="Backend API for Soin APP",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
try:
    client = MongoClient(MONGO_URL)
    db = client["soin_healthcare"]
    users_collection = db["users"]
    # Test connection
    client.admin.command('ping')
    print("✓ MongoDB connected successfully")
except Exception as e:
    print(f"✗ MongoDB connection failed: {e}")
    db = None
    users_collection = None

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pydantic models
class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    age: int
    role: str  # "patient", "doctor", or "admin"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Create API router
api_router = APIRouter()

# Health check endpoint
@api_router.get("/health")
async def health_check():
    """Health check endpoint to verify API is running."""
    mongo_status = "connected" if db is not None else "disconnected"
    return JSONResponse(
        content={
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "service": "Soin API",
            "database": mongo_status
        },
        media_type="application/json"
    )

# User registration endpoint
@api_router.post("/register")
async def register_user(user: UserRegister):
    """Register a new user."""
    try:
        # Check if MongoDB is connected
        if users_collection is None:
            raise HTTPException(
                status_code=500, 
                detail="Database connection not available"
            )
        
        # Validate role
        if user.role.lower() not in ["patient", "doctor", "admin"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid role. Must be 'patient', 'doctor', or 'admin'"
            )
        
        # Check if user already exists
        existing_user = users_collection.find_one({"email": user.email})
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        
        # Hash password
        hashed_password = pwd_context.hash(user.password)
        
        # Create user document
        user_doc = {
            "full_name": user.full_name,
            "email": user.email,
            "password": hashed_password,
            "age": user.age,
            "role": user.role.lower(),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "is_active": True
        }
        
        # Insert into MongoDB
        result = users_collection.insert_one(user_doc)
        
        return JSONResponse(
            content={
                "message": "Registration successful",
                "user_id": str(result.inserted_id),
                "email": user.email,
                "role": user.role.lower()
            },
            status_code=201
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
        )

# User login endpoint
@api_router.post("/login")
async def login_user(credentials: UserLogin):
    """Authenticate user login."""
    try:
        # Check if MongoDB is connected
        if users_collection is None:
            raise HTTPException(
                status_code=500,
                detail="Database connection not available"
            )
        
        # Find user by email
        user = users_collection.find_one({"email": credentials.email})
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not pwd_context.verify(credentials.password, user["password"]):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        # Check if account is active
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=403,
                detail="Account is disabled"
            )
        
        return JSONResponse(
            content={
                "message": "Login successful",
                "user_id": str(user["_id"]),
                "email": user["email"],
                "full_name": user["full_name"],
                "role": user["role"]
            },
            status_code=200
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Login failed: {str(e)}"
        )

# Include router in app
app.include_router(api_router, prefix="/api")

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Soin Healthcare API", "version": "1.0.0"}
