# 🔧 Vercel Configuration Files Explained

This document explains all the Vercel-specific files and their purposes.

---

## File Structure

```
/app/
├── vercel.json                    # Main Vercel configuration
├── .vercelignore                  # Files to ignore during deployment
├── VERCEL_DEPLOYMENT_GUIDE.md     # Comprehensive deployment guide
├── QUICK_START.md                 # Quick deployment steps
├── api/                           # Serverless API functions
│   ├── index.py                  # API handler (wraps FastAPI)
│   └── requirements.txt          # Python dependencies for API
├── backend/                       # Backend application
│   ├── server.py                 # FastAPI application
│   ├── requirements.txt          # Full backend dependencies
│   └── .env.example              # Environment variable template
└── frontend/                      # Frontend application
    ├── package.json              # React dependencies
    └── .env.example              # Frontend env template
```

---

## vercel.json

```json
{
  "version": 2,
  "name": "soin-healthcare",
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.py"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/build/$1"
    }
  ],
  "env": {
    "PYTHON_VERSION": "3.11"
  },
  "functions": {
    "api/index.py": {
      "maxDuration": 10,
      "memory": 1024
    }
  },
  "installCommand": "cd frontend && yarn install",
  "buildCommand": "cd frontend && yarn build",
  "outputDirectory": "frontend/build",
  "framework": null
}
```

### Configuration Breakdown:

#### `builds`
- Tells Vercel how to build the API
- Uses `@vercel/python` builder for Python serverless functions

#### `routes`
1. **API Routes**: Any request to `/api/*` goes to the Python serverless function
2. **Frontend Routes**: All other requests serve static files from React build

#### `env`
- Sets Python version to 3.11 (compatible with dependencies)

#### `functions`
- **maxDuration**: 10 seconds (free tier limit)
- **memory**: 1024 MB (recommended for FastAPI + MongoDB)

#### Build Commands
- **installCommand**: Install React dependencies
- **buildCommand**: Build React production bundle
- **outputDirectory**: Where the built React app is located

---

## api/index.py

```python
from mangum import Mangum
import sys
from pathlib import Path

# Add backend directory to Python path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

# Import the FastAPI app
from server import app

# Create handler for Vercel
handler = Mangum(app)
```

### Purpose:
- **Mangum**: Adapter that converts FastAPI (ASGI) to work with AWS Lambda/Vercel
- **Path manipulation**: Ensures Python can find the backend module
- **handler**: The function Vercel calls for each request

---

## api/requirements.txt

Minimal dependencies needed for the serverless function:

```txt
fastapi==0.110.1
mangum==0.17.0
motor==3.3.1
pymongo==4.5.0
pydantic==2.12.3
# ... other essential dependencies
```

### Why separate from backend/requirements.txt?
- Serverless functions have size limits
- Only includes production dependencies
- Excludes dev tools (black, flake8, pytest)

---

## .vercelignore

Files and directories excluded from deployment:

```
# Not needed in production
node_modules/
__pycache__/
tests/
.env
logs/
backend/uploads/
```

### Benefits:
- Reduces deployment size
- Speeds up deployment time
- Prevents sensitive files from being deployed

---

## Environment Variables

### Backend Variables (Set in Vercel Dashboard)

```env
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/db
DB_NAME=soin_healthcare
SECRET_KEY=your-jwt-secret-key
CORS_ORIGINS=https://your-app.vercel.app
```

### Frontend Variables (Set in Vercel Dashboard)

```env
REACT_APP_BACKEND_URL=https://your-app.vercel.app
```

### How Vercel Handles Environment Variables:
1. Set in Vercel dashboard under Settings → Environment Variables
2. Available to both build-time (frontend) and runtime (backend)
3. Not committed to repository (security)

---

## Deployment Flow

### 1. Build Phase
```bash
# Vercel runs these commands:
cd frontend && yarn install
cd frontend && yarn build
```

### 2. Function Preparation
```bash
# Vercel automatically:
- Installs api/requirements.txt
- Creates serverless function from api/index.py
- Packages backend code with function
```

### 3. Deployment
```
- Static files (React build) → Vercel CDN
- API function → Vercel Serverless (AWS Lambda)
- DNS configuration → Vercel Edge Network
```

---

## Request Flow in Production

```
User Browser
    ↓
Vercel Edge Network (CDN)
    ↓
┌─────────────┬──────────────┐
│   /api/*    │    other     │
│      ↓      │      ↓       │
│  Serverless │  Static Files│
│  Function   │  (React)     │
│      ↓      │              │
│  MongoDB    │              │
│  Atlas      │              │
└─────────────┴──────────────┘
```

---

## Limitations & Considerations

### Serverless Function Limits (Free Tier)

| Limit | Value | Impact |
|-------|-------|--------|
| Execution Time | 10 seconds | Long operations may timeout |
| Memory | 1024 MB | Sufficient for most operations |
| Payload Size | 4.5 MB | Large file uploads will fail |
| Cold Start | 2-5 seconds | First request may be slow |

### Solutions:

#### Large File Uploads
**Problem**: Tongue image uploads may exceed 4.5 MB limit

**Solutions**:
1. **Frontend compression**: Compress images before upload
2. **External storage**: Use Vercel Blob, Cloudinary, or S3
3. **Direct upload**: Use signed URLs for direct-to-storage uploads

#### Cold Starts
**Problem**: Function sleeps when not used

**Solutions**:
1. Accept 2-5 second delay on first request
2. Use Vercel Pro for better performance
3. Implement a ping/warmup endpoint

#### File Persistence
**Problem**: Uploaded files stored locally are lost

**Solutions**:
1. Use external storage (required for production)
2. Store only file metadata in MongoDB
3. Use pre-signed URLs for file access

---

## Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env` files
- ✅ Use strong SECRET_KEY (min 32 characters)
- ✅ Rotate secrets regularly

### 2. CORS Configuration
```env
# Development
CORS_ORIGINS=*

# Production
CORS_ORIGINS=https://your-app.vercel.app,https://www.yourdomain.com
```

### 3. MongoDB Security
- ✅ Use strong database passwords
- ✅ Enable MongoDB Atlas audit logs
- ✅ Review network access rules regularly

---

## Useful Resources

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Python Runtime**: https://vercel.com/docs/runtimes#official-runtimes/python
- **Mangum Docs**: https://mangum.io/
- **FastAPI Deployment**: https://fastapi.tiangolo.com/deployment/
- **MongoDB Atlas**: https://docs.atlas.mongodb.com/

---

**Note**: This configuration is optimized for the free tier. For production use with high traffic, consider upgrading to paid tiers and implementing additional optimizations.
