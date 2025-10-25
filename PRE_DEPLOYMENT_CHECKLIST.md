# ✅ Pre-Deployment Checklist

Use this checklist to ensure everything is ready before deploying to Vercel.

## MongoDB Atlas Setup

- [ ] MongoDB Atlas account created
- [ ] Free M0 cluster created
- [ ] Database user created with read/write permissions
  - Username: ____________
  - Password: ____________ (saved securely)
- [ ] Network access configured to allow 0.0.0.0/0
- [ ] Connection string obtained and tested
  - Format: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`
  - Connection string saved: [ ]

## GitHub Repository

- [ ] GitHub repository created
  - Repository URL: ____________
- [ ] Code pushed to main branch
- [ ] All required files present:
  - [ ] `/vercel.json`
  - [ ] `/api/index.py`
  - [ ] `/api/requirements.txt`
  - [ ] `/backend/server.py`
  - [ ] `/backend/requirements.txt`
  - [ ] `/backend/vercel_compat.py`
  - [ ] `/frontend/package.json`
  - [ ] `/.gitignore`
  - [ ] `/.vercelignore`

## Environment Variables Prepared

### Backend Variables
- [ ] `MONGO_URL` - MongoDB connection string
- [ ] `DB_NAME` - Database name (e.g., `soin_healthcare`)
- [ ] `SECRET_KEY` - Strong JWT secret key (min 32 characters)
- [ ] `CORS_ORIGINS` - CORS origins (use `*` for testing, specific domain for production)

### Frontend Variables (add after first deployment)
- [ ] `REACT_APP_BACKEND_URL` - Will be your Vercel deployment URL

## Code Verification

### Backend Checks
- [ ] No hardcoded environment variables
- [ ] No local file paths (using vercel_compat.py)
- [ ] Admin creation handled properly (not relying on startup events)
- [ ] MongoDB connection optimized for serverless
- [ ] CORS properly configured
- [ ] All imports working
- [ ] No syntax errors

### Frontend Checks
- [ ] No hardcoded API URLs
- [ ] Uses environment variable for backend URL
- [ ] Build command works: `cd frontend && yarn build`
- [ ] No console errors in local build
- [ ] All dependencies in package.json

## Local Testing

- [ ] Backend runs locally without errors
  ```bash
  cd backend
  pip install -r requirements.txt
  uvicorn server:app --reload
  ```

- [ ] Frontend runs locally without errors
  ```bash
  cd frontend
  yarn install
  yarn start
  ```

- [ ] Frontend builds successfully
  ```bash
  cd frontend
  yarn build
  ```

- [ ] API endpoints tested locally:
  - [ ] Health check: `http://localhost:8001/api/health`
  - [ ] Register endpoint works
  - [ ] Login endpoint works
  - [ ] Protected endpoints work with JWT

## Vercel Account

- [ ] Vercel account created at https://vercel.com
- [ ] GitHub account connected to Vercel
- [ ] Billing plan verified (Free tier is fine)

## Deployment Preparation

- [ ] All `.env` files removed from git (should be in .gitignore)
- [ ] No sensitive data in code
- [ ] Default admin password documented
- [ ] README.md updated with deployment info
- [ ] All changes committed to git
  ```bash
  git add .
  git commit -m "Ready for Vercel deployment"
  git push origin main
  ```

## Post-Deployment Steps (Do After First Deploy)

- [ ] Deployment successful
- [ ] Note deployment URL: ____________
- [ ] Add `REACT_APP_BACKEND_URL` environment variable with deployment URL
- [ ] Redeploy after adding frontend env variable
- [ ] Test health endpoint: `https://your-app.vercel.app/api/health`
- [ ] Test admin login
  - Email: workwithgrover@gmail.com
  - Password: win40xp
- [ ] Change admin password immediately!
- [ ] Test patient registration
- [ ] Test data submission
- [ ] Check Vercel function logs for any errors
- [ ] Update CORS_ORIGINS to specific domain (if desired)

## Known Limitations

- [ ] Understood: File uploads are ephemeral in serverless (will be lost)
- [ ] Understood: Function timeout is 10 seconds on free tier
- [ ] Understood: Cold starts may cause slow first requests
- [ ] Understood: For production, need external file storage solution

## Security Checklist

- [ ] Default admin password will be changed after deployment
- [ ] Strong SECRET_KEY generated (not the default)
- [ ] MongoDB Atlas password is strong
- [ ] No API keys or secrets in code
- [ ] CORS properly configured for production

## Documentation

- [ ] Read QUICK_START.md
- [ ] Read VERCEL_DEPLOYMENT_GUIDE.md
- [ ] Bookmarked TROUBLESHOOTING.md for reference
- [ ] Team members have access to environment variables

## Emergency Contacts

- Vercel Support: https://vercel.com/support
- MongoDB Support: https://www.mongodb.com/community/forums/
- Project Repository: ____________

## Notes

```
Add any specific notes or considerations for your deployment here:




```

---

## Ready to Deploy?

If all items above are checked, you're ready to deploy to Vercel!

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Add environment variables
4. Click Deploy!
5. Follow post-deployment steps above

## Deployment Date

- First Deployment: ____________
- Last Updated: ____________
- Deployed By: ____________

---

**Good luck with your deployment! 🚀**
