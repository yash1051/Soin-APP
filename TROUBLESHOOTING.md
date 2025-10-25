# 🔍 Vercel Deployment Troubleshooting Guide

This guide helps you resolve common issues when deploying SOIN Healthcare to Vercel.

---

## 🚨 Common Issues & Solutions

### 1. Build Failed During Deployment

#### Symptom:
```
Error: Build failed with exit code 1
```

#### Possible Causes & Solutions:

**A. Missing Dependencies**
```bash
# Check if all dependencies are in package.json
cd frontend
yarn install
yarn build  # Test locally first
```

**Solution**: 
- Ensure all imports in your code have corresponding packages in `package.json`
- Check Vercel build logs for "Module not found" errors

**B. Node Version Mismatch**
```json
// Add to frontend/package.json
"engines": {
  "node": ">=18.0.0"
}
```

**C. Build Command Failure**
- Verify build command in Vercel settings: `cd frontend && yarn build`
- Check if craco.config.js is present
- Ensure all environment variables are set

---

### 2. "502: Bad Gateway" After Deployment

#### Symptom:
```
502
BAD_GATEWAY
```

#### Possible Causes & Solutions:

**A. MongoDB Connection Failure**

**Check**:
1. Is `MONGO_URL` set in Vercel environment variables?
2. Is the connection string correct?
3. Is MongoDB Atlas network access configured for 0.0.0.0/0?

**Test MongoDB Connection**:
```python
# Test locally
from pymongo import MongoClient
client = MongoClient("your-connection-string")
print(client.server_info())  # Should print MongoDB version
```

**Solution**:
```
1. Go to MongoDB Atlas → Network Access
2. Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
3. Wait 2-3 minutes for changes to propagate
4. Redeploy on Vercel
```

**B. Missing Environment Variables**

**Check** in Vercel Dashboard → Settings → Environment Variables:
- ✅ MONGO_URL
- ✅ DB_NAME
- ✅ SECRET_KEY
- ✅ CORS_ORIGINS

**Solution**: Add all required variables and redeploy

**C. Python Function Error**

**Check Function Logs**:
1. Vercel Dashboard → Deployments
2. Click on latest deployment
3. Click "Functions" tab
4. Look for error messages

Common errors:
```python
# Import error
ModuleNotFoundError: No module named 'server'

# Solution: Check api/index.py path configuration
```

---

### 3. Frontend Loads But API Calls Fail

#### Symptom:
```javascript
// Browser console
Failed to fetch
net::ERR_CONNECTION_REFUSED
```

#### Solutions:

**A. Check REACT_APP_BACKEND_URL**

**Problem**: Frontend doesn't know where to find the backend

**Solution**:
```bash
# In Vercel Dashboard
Environment Variables → Add:
REACT_APP_BACKEND_URL = https://your-app-name.vercel.app

# Then redeploy!
```

**B. Check API Route Configuration**

**Verify** in vercel.json:
```json
"routes": [
  {
    "src": "/api/(.*)",
    "dest": "/api/index.py"
  }
]
```

**C. CORS Issues**

**Symptom**:
```
Access to fetch blocked by CORS policy
```

**Solution**:
```bash
# Set in Vercel environment variables
CORS_ORIGINS = *  # For testing
# Or
CORS_ORIGINS = https://your-app.vercel.app  # For production
```

---

### 4. "Module Not Found" Errors

#### Symptom:
```python
ModuleNotFoundError: No module named 'XXX'
```

#### Solutions:

**A. Missing in api/requirements.txt**

**Check**: Is the module listed in `/app/api/requirements.txt`?

**Solution**:
```bash
# Add to api/requirements.txt
module-name==version

# Commit and push
git add api/requirements.txt
git commit -m "Add missing dependency"
git push
```

**B. Version Conflicts**

**Solution**: Use exact versions that work together
```txt
# In api/requirements.txt
fastapi==0.110.1
pydantic==2.12.3
starlette==0.37.2
```

---

### 5. Database Operations Timeout

#### Symptom:
```
Task timed out after 10.00 seconds
```

#### Causes:
1. MongoDB connection is slow
2. Query is not optimized
3. No database indexes

#### Solutions:

**A. Add Database Indexes**
```javascript
// In MongoDB Atlas
// Database → Browse Collections → Indexes

// Add these indexes:
db.users.createIndex({ "email": 1 }, { unique: true })
db.submissions.createIndex({ "patient_id": 1, "created_at": -1 })
```

**B. Optimize MongoDB Connection**
```python
# In server.py
client = AsyncIOMotorClient(
    mongo_url,
    maxPoolSize=10,
    minPoolSize=2,
    serverSelectionTimeoutMS=5000
)
```

**C. Upgrade Vercel Function Timeout**
```json
// In vercel.json (requires Pro plan for > 10s)
"functions": {
  "api/index.py": {
    "maxDuration": 60  // Pro plan required
  }
}
```

---

### 6. File Upload Failures

#### Symptom:
```
413 Payload Too Large
```

#### Cause:
Vercel has 4.5 MB payload limit for serverless functions

#### Solutions:

**A. Compress Images on Frontend**
```javascript
// Add image compression before upload
import imageCompression from 'browser-image-compression';

const compressImage = async (file) => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  };
  return await imageCompression(file, options);
};
```

**B. Use External Storage**

**Option 1: Cloudinary (Free tier: 25GB storage)**
```bash
# Install
yarn add cloudinary

# Configure
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Option 2: Vercel Blob (Requires Pro)**
```bash
yarn add @vercel/blob
```

**Option 3: AWS S3 (Free tier: 5GB)**
```bash
pip install boto3
```

---

### 7. Environment Variables Not Working

#### Symptom:
```python
KeyError: 'MONGO_URL'
```

#### Solutions:

**A. Check Variable Names**
- Must be EXACT match (case-sensitive)
- No extra spaces
- In Vercel Dashboard, not in .env file

**B. Redeploy After Adding Variables**
1. Add/edit variable in Vercel Dashboard
2. Go to Deployments tab
3. Click ⋮ on latest deployment
4. Click "Redeploy"

**C. Check Environment Scope**
Make sure variables are set for "Production" environment

---

### 8. Cold Start / Slow First Request

#### Symptom:
First request takes 5-10 seconds, then normal

#### Cause:
This is **normal** for serverless functions (they "sleep" when not used)

#### Solutions:

**A. Accept It** (Free Tier)
- This is expected behavior
- Subsequent requests are fast
- Users only notice on first visit

**B. Implement Warmup** (Partial Solution)
```javascript
// Add a warmup endpoint
@api_router.get("/warmup")
async def warmup():
    return {"status": "warm"}

// Ping it periodically (external service)
// Every 5 minutes to keep function warm
```

**C. Upgrade to Pro** (Best Solution)
- Vercel Pro has better performance
- Reduced cold starts
- Worth it for production use

---

### 9. Static Files (Images/CSS) Not Loading

#### Symptom:
```
404 Not Found
/static/css/main.xxx.css
```

#### Solutions:

**A. Check Build Output**
```bash
# Verify build directory locally
cd frontend
yarn build
ls -la build/  # Should contain static/ folder
```

**B. Verify Vercel Configuration**
```json
// vercel.json
"outputDirectory": "frontend/build"
```

**C. Check Public URL**
Make sure you're using correct paths:
```javascript
// Correct
<img src="/logo.png" />

// Incorrect
<img src="./logo.png" />
```

---

### 10. Authentication Not Working

#### Symptom:
```
401 Unauthorized
Invalid token
```

#### Solutions:

**A. Check SECRET_KEY**
```bash
# In Vercel environment variables
SECRET_KEY = your-secret-key-must-be-same-as-used-to-create-tokens
```

**B. Token Expiration**
```python
# Check token expiration time in server.py
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
```

**C. CORS Headers**
```python
# Ensure credentials are allowed
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,  # Important!
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🔧 Debugging Tools

### 1. View Vercel Function Logs

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# View logs
vercel logs your-app-name --follow
```

### 2. Test API Locally

```bash
# Run backend locally
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001

# Test endpoint
curl http://localhost:8001/api/admin/stats
```

### 3. Check MongoDB Connection

```bash
# Install MongoDB tools
pip install pymongo

# Test connection
python3 << EOF
from pymongo import MongoClient
client = MongoClient("your-connection-string")
print(client.list_database_names())
EOF
```

### 4. Browser Developer Tools

```javascript
// Open browser console (F12)
// Check:
1. Console tab → Look for JavaScript errors
2. Network tab → Check API calls (status, response)
3. Application tab → Check localStorage for tokens
```

---

## 📋 Pre-Deployment Checklist

Before deploying, verify:

**MongoDB Atlas:**
- [ ] Cluster created and running
- [ ] Database user created with read/write access
- [ ] Network access set to 0.0.0.0/0
- [ ] Connection string tested locally

**Code Repository:**
- [ ] All code pushed to GitHub
- [ ] vercel.json present in root
- [ ] api/index.py present
- [ ] api/requirements.txt present
- [ ] No .env files committed

**Environment Variables:**
- [ ] MONGO_URL set in Vercel
- [ ] DB_NAME set in Vercel
- [ ] SECRET_KEY set in Vercel
- [ ] CORS_ORIGINS set in Vercel
- [ ] REACT_APP_BACKEND_URL set (after first deploy)

**Testing:**
- [ ] Backend tested locally
- [ ] Frontend tested locally
- [ ] Production build tested (`yarn build`)

---

## 🆘 Still Having Issues?

### 1. Check Vercel Status
Visit: https://www.vercel-status.com/

### 2. Check MongoDB Atlas Status
Visit: https://status.mongodb.com/

### 3. Review Recent Changes
```bash
git log -5  # See last 5 commits
git diff HEAD~1  # See last changes
```

### 4. Try Clean Deployment
```bash
# Delete node_modules and rebuild
rm -rf frontend/node_modules frontend/build
cd frontend
yarn install
yarn build

# Commit and push
git add .
git commit -m "Clean rebuild"
git push
```

### 5. Contact Support

**Vercel Support:**
- Free tier: Community forums
- Pro tier: Email support
- https://vercel.com/support

**Community Help:**
- Vercel Discord: https://vercel.com/discord
- GitHub Discussions: https://github.com/vercel/vercel/discussions

---

## 📞 Quick Reference

### Vercel Dashboard URLs
- Main Dashboard: https://vercel.com/dashboard
- Project Settings: https://vercel.com/[username]/[project]/settings
- Environment Variables: https://vercel.com/[username]/[project]/settings/environment-variables
- Deployments: https://vercel.com/[username]/[project]/deployments
- Function Logs: Click deployment → Functions tab

### MongoDB Atlas URLs
- Main Dashboard: https://cloud.mongodb.com/
- Network Access: https://cloud.mongodb.com/v2/[project]/security/network/accessList
- Database Access: https://cloud.mongodb.com/v2/[project]/security/database/users
- Connect: https://cloud.mongodb.com/v2/[project]#/clusters/connect

---

## ✅ Success Indicators

Your deployment is successful when:

1. ✅ Vercel build completes without errors
2. ✅ Deployment URL is accessible
3. ✅ Homepage loads correctly
4. ✅ Can login with admin credentials
5. ✅ Can register new user
6. ✅ API calls work (check Network tab)
7. ✅ No errors in browser console
8. ✅ No errors in Vercel function logs

---

**Last Updated**: January 2025
**For**: SOIN Healthcare Vercel Deployment
