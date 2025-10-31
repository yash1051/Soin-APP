# 🚀 Complete Vercel Deployment Guide - SOIN Healthcare

This guide will walk you through deploying your SOIN Healthcare application on Vercel's **free tier** with complete accuracy.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [MongoDB Atlas Setup (Free)](#mongodb-atlas-setup)
3. [Prepare Your Application](#prepare-your-application)
4. [Deploy to Vercel](#deploy-to-vercel)
5. [Configure Environment Variables](#configure-environment-variables)
6. [Post-Deployment Configuration](#post-deployment-configuration)
7. [Testing Your Deployment](#testing-your-deployment)
8. [Troubleshooting](#troubleshooting)
9. [Important Notes & Limitations](#important-notes--limitations)

---

## 1. Prerequisites

Before you begin, ensure you have:

- ✅ A GitHub account (free)
- ✅ A Vercel account (free) - Sign up at [vercel.com](https://vercel.com)
- ✅ A MongoDB Atlas account (free) - Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- ✅ Your application code pushed to a GitHub repository

---

## 2. MongoDB Atlas Setup (Free)

### Step 2.1: Create a Free MongoDB Cluster

1. **Go to MongoDB Atlas**: Visit [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Sign Up/Login**: Create a free account or login

3. **Create a New Cluster**:
   - Click **"Build a Database"**
   - Select **"M0 FREE"** tier (Shared cluster)
   - Choose a cloud provider (AWS recommended)
   - Select a region closest to your users
   - Click **"Create Cluster"**

### Step 2.2: Configure Database Access

1. **Create Database User**:
   - Go to **"Database Access"** in the left sidebar
   - Click **"Add New Database User"**
   - Choose **"Password"** authentication
   - Enter a username (e.g., `soin_admin`)
   - Generate a secure password (SAVE THIS - you'll need it!)
   - Under **"Database User Privileges"**, select **"Read and write to any database"**
   - Click **"Add User"**

### Step 2.3: Configure Network Access

1. **Whitelist IP Addresses**:
   - Go to **"Network Access"** in the left sidebar
   - Click **"Add IP Address"**
   - Click **"Allow Access from Anywhere"** (enters `0.0.0.0/0`)
   - Click **"Confirm"**
   
   ⚠️ **Note**: For production, you should restrict this to specific IPs, but Vercel uses dynamic IPs, so this is necessary for serverless functions.

### Step 2.4: Get Your Connection String

1. **Get Connection String**:
   - Go to **"Database"** in the left sidebar
   - Click **"Connect"** on your cluster
   - Select **"Connect your application"**
   - Choose **"Python"** as the driver
   - Copy the connection string (looks like):
   
   ```
   mongodb+srv://soin_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

2. **Format the Connection String**:
   - Replace `<password>` with your actual database user password
   - Add your database name before the `?` (e.g., `/soin_healthcare`)
   
   Final format:
   ```
   mongodb+srv://soin_admin:yourpassword@cluster0.xxxxx.mongodb.net/soin_healthcare?retryWrites=true&w=majority
   ```

   **SAVE THIS STRING - You'll need it for Vercel environment variables!**

---

## 3. Prepare Your Application

### Step 3.1: Push Code to GitHub

1. **Create a GitHub Repository**:
   - Go to [github.com](https://github.com) and create a new repository
   - Name it (e.g., `soin-healthcare`)
   - Make it **Public** or **Private** (both work with Vercel)

2. **Push Your Code**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Ready for Vercel deployment"
   git branch -M main
   git remote add origin https://github.com/yourusername/soin-healthcare.git
   git push -u origin main
   ```

### Step 3.2: Verify Required Files

Ensure these files exist in your repository:

✅ `/vercel.json` - Vercel configuration
✅ `/api/index.py` - Serverless function handler
✅ `/backend/server.py` - FastAPI backend
✅ `/backend/requirements.txt` - Python dependencies
✅ `/frontend/package.json` - React dependencies
✅ `/frontend/.env.example` - Environment variable template

---

## 4. Deploy to Vercel

### Step 4.1: Import Your Project

1. **Go to Vercel Dashboard**: Visit [vercel.com/dashboard](https://vercel.com/dashboard)

2. **Click "Add New Project"**

3. **Import from GitHub**:
   - Click **"Import Git Repository"**
   - If not connected, click **"Connect GitHub"** and authorize Vercel
   - Find your repository (`soin-healthcare`) and click **"Import"**

### Step 4.2: Configure Project Settings

1. **Framework Preset**: 
   - Vercel should auto-detect **"Create React App"**
   - If not, select it manually

2. **Root Directory**: 
   - Leave as `./` (root)

3. **Build and Output Settings**:
   - **Build Command**: Leave as default or set to `yarn build`
   - **Output Directory**: `frontend/build`
   - **Install Command**: `yarn install`

4. **Environment Variables** (Add these now):

   Click **"Environment Variables"** and add:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `MONGO_URL` | `mongodb+srv://soin_admin:yourpassword@cluster0.xxxxx.mongodb.net/soin_healthcare?retryWrites=true&w=majority` | Production |
   | `DB_NAME` | `soin_healthcare` | Production |
   | `SECRET_KEY` | `your-super-secret-jwt-key-change-this` | Production |
   | `CORS_ORIGINS` | `*` | Production |

   ⚠️ **IMPORTANT**: 
   - Replace `MONGO_URL` with YOUR actual MongoDB connection string
   - Generate a strong `SECRET_KEY` (use a password generator)
   - For `CORS_ORIGINS`, you can use `*` for development, but in production, use your Vercel domain

5. **Click "Deploy"**

### Step 4.3: Wait for Deployment

- Vercel will now build and deploy your application
- This typically takes 2-5 minutes
- Watch the build logs for any errors
- Once complete, you'll get a deployment URL (e.g., `https://your-app.vercel.app`)

---

## 5. Configure Environment Variables

### Step 5.1: Add Frontend Environment Variable

After your first deployment:

1. Go to your Vercel project dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add the following:

   | Name | Value |
   |------|-------|
   | `REACT_APP_BACKEND_URL` | `https://your-app.vercel.app` |

   Replace `your-app.vercel.app` with your actual Vercel deployment URL

4. Click **"Save"**

### Step 5.2: Redeploy

1. Go to the **"Deployments"** tab
2. Click the **three dots (...)** on the latest deployment
3. Click **"Redeploy"**
4. Check **"Use existing Build Cache"** (optional)
5. Click **"Redeploy"**

---

## 6. Post-Deployment Configuration

### Step 6.1: Update CORS Origins

For better security, update the `CORS_ORIGINS` environment variable:

1. Go to **Settings** → **Environment Variables**
2. Edit `CORS_ORIGINS`
3. Change from `*` to your actual Vercel URL:
   ```
   https://your-app.vercel.app
   ```
4. Save and redeploy

### Step 6.2: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Click **"Add"**
3. Enter your custom domain
4. Follow Vercel's instructions to configure DNS

---

## 7. Testing Your Deployment

### Step 7.1: Access Your Application

1. Open your deployment URL: `https://your-app.vercel.app`
2. You should see the SOIN Healthcare login page

### Step 7.2: Test Admin Login

Default admin credentials:
- **Email**: `workwithgrover@gmail.com`
- **Password**: `win40xp`

### Step 7.3: Test Core Features

1. ✅ **User Registration**: Register as a patient
2. ✅ **Login**: Login with new account
3. ✅ **Submit Data**: Try submitting diabetes data (⚠️ See limitations below)
4. ✅ **View Submissions**: Check if data displays correctly

---

## 8. Troubleshooting

### Issue 1: Build Fails

**Solution**: Check build logs in Vercel dashboard
- Common issue: Missing dependencies
- Fix: Ensure all dependencies are in `package.json` and `requirements.txt`

### Issue 2: "502: Bad Gateway" or API Not Working

**Solution**:
1. Check if `MONGO_URL` is correctly set in environment variables
2. Verify MongoDB Atlas network access allows `0.0.0.0/0`
3. Check Vercel function logs: Go to **Deployments** → Click deployment → **Functions** tab

### Issue 3: Frontend Can't Connect to Backend

**Solution**:
1. Verify `REACT_APP_BACKEND_URL` is set correctly
2. Ensure it matches your Vercel deployment URL
3. Redeploy after adding environment variable

### Issue 4: Database Connection Errors

**Solution**:
1. Test connection string locally first
2. Ensure database user has correct permissions
3. Check if IP whitelist includes `0.0.0.0/0`
4. Verify password doesn't contain special characters that need URL encoding

### Issue 5: CORS Errors

**Solution**:
1. Set `CORS_ORIGINS` to `*` temporarily for testing
2. Check if backend routes have `/api` prefix
3. Verify vercel.json routes configuration

---

## 9. Important Notes & Limitations

### 🚨 Critical Limitations on Vercel Free Tier

#### 1. **File Upload Limitations**
- **Issue**: Vercel serverless functions have a **4.5 MB** payload limit
- **Impact**: Tongue image uploads might fail if images are too large
- **Solutions**:
  - Compress images on frontend before upload
  - Use external storage like:
    - **Vercel Blob** (requires paid plan)
    - **Cloudinary** (free tier available)
    - **AWS S3** (free tier available)
    - **Supabase Storage** (free tier available)

#### 2. **Function Timeout**
- **Issue**: Free tier has 10-second execution limit
- **Impact**: Long-running operations may timeout
- **Current Setting**: Configured to 10 seconds in `vercel.json`

#### 3. **Cold Starts**
- **Issue**: Serverless functions "sleep" when not used
- **Impact**: First request after inactivity may be slow (2-5 seconds)
- **This is normal** and expected on free tier

#### 4. **No Persistent Storage**
- **Issue**: Vercel functions are stateless
- **Impact**: Uploaded files stored locally will be lost
- **Solution**: Must use external storage (see File Upload Limitations)

### ⚡ Performance Optimizations

1. **Image Compression**: Add frontend image compression
2. **Caching**: Leverage Vercel's CDN caching
3. **Database Indexing**: Add indexes in MongoDB for faster queries

### 🔒 Security Recommendations

1. **Change Default Admin Password** immediately after deployment
2. **Use Strong SECRET_KEY** for JWT tokens
3. **Enable MongoDB Atlas Audit Logs** (available on paid tiers)
4. **Restrict CORS_ORIGINS** to your specific domain
5. **Enable HTTPS** (automatic on Vercel)

### 💰 Free Tier Limits

**Vercel Free Tier:**
- 100 GB bandwidth/month
- 100 hours function execution/month
- Unlimited projects
- Automatic HTTPS

**MongoDB Atlas Free Tier:**
- 512 MB storage
- Shared RAM
- No backups
- Suitable for ~5,000 users

---

## 📝 Environment Variables Reference

### Complete List of Required Environment Variables

**For Vercel Dashboard** (Production):

```env
# Backend/API Variables
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
DB_NAME=soin_healthcare
SECRET_KEY=your-secret-jwt-key-min-32-characters
CORS_ORIGINS=https://your-app.vercel.app

# Frontend Variables
REACT_APP_BACKEND_URL=https://your-app.vercel.app
```

---

## 🎯 Deployment Checklist

Before deploying, ensure:

- [ ] MongoDB Atlas cluster created and configured
- [ ] Database user created with read/write permissions
- [ ] Network access configured (0.0.0.0/0)
- [ ] Connection string obtained and tested
- [ ] Code pushed to GitHub repository
- [ ] vercel.json file exists in root
- [ ] All environment variables prepared
- [ ] Default admin password documented

After deploying:

- [ ] Verify deployment URL is accessible
- [ ] Test admin login
- [ ] Test patient registration
- [ ] Test API endpoints
- [ ] Check function logs for errors
- [ ] Update CORS_ORIGINS to specific domain
- [ ] Change default admin password
- [ ] Test on multiple devices/browsers

---

## 🆘 Getting Help

**Vercel Resources:**
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

**MongoDB Resources:**
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Community Forums](https://www.mongodb.com/community/forums/)

**Application-Specific Issues:**
- Check Vercel function logs
- Check browser console for errors
- Verify all environment variables are set correctly

---

## 🎉 Success!

If you've followed all steps correctly, your SOIN Healthcare application should now be live on Vercel! 

Your application will be available at: `https://your-app.vercel.app`

**Default Admin Access:**
- Email: `workwithgrover@gmail.com`
- Password: `win40xp`

**⚠️ Remember to change the admin password immediately!**

---

## 📌 Quick Reference Commands

```bash
# Test MongoDB connection locally
python -c "from pymongo import MongoClient; client = MongoClient('your-connection-string'); print(client.server_info())"

# Build frontend locally
cd frontend
yarn install
yarn build

# Run backend locally
cd backend
pip install -r requirements.txt
uvicorn server:app --reload

# Push updates to GitHub (triggers auto-deploy)
git add .
git commit -m "Update application"
git push origin main
```

---

**Last Updated**: January 2025
**Application**: SOIN Healthcare - Diabetes Management Platform
**Deployment Target**: Vercel (Free Tier)
**Database**: MongoDB Atlas (Free Tier)
