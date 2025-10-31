# SOIN Healthcare - Diabetes Management Platform
A comprehensive healthcare platform for managing diabetes data with tongue image analysis, built with FastAPI, React, and MongoDB.

## 🚀 Quick Start

### Local Development

#### Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your values
uvicorn server:app --reload --port 8001
```

#### Frontend Setup
```bash
cd frontend
yarn install
cp .env.example .env
# Edit .env with backend URL
yarn start
```

### Vercel Deployment (Free)
**📖 Comprehensive Guides Available:**
- **[QUICK_START.md](./QUICK_START.md)** - 15-minute deployment guide
- **[VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)** - Complete deployment documentation
- **[VERCEL_CONFIGURATION.md](./VERCEL_CONFIGURATION.md)** - Technical configuration details
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions

**Quick Deployment Steps:**
1. **Setup MongoDB Atlas** (Free)
   - Create cluster at https://www.mongodb.com/cloud/atlas
   - Create database user
   - Configure network access (0.0.0.0/0)
   - Get connection string

2. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/repo.git
   git push -u origin main
   ```

3. **Deploy to Vercel**
   - Import project at https://vercel.com/new
   - Add environment variables (see below)

<!-- Deployment trigger -->
