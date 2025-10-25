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
   - Deploy!

4. **Environment Variables** (Set in Vercel Dashboard)
   ```
   MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/db
   DB_NAME=soin_healthcare
   SECRET_KEY=your-secret-key
   CORS_ORIGINS=*
   REACT_APP_BACKEND_URL=https://your-app.vercel.app
   ```

## 📁 Project Structure

```
/app/
├── api/                           # Vercel serverless functions
│   ├── index.py                  # API handler
│   └── requirements.txt          # API dependencies
├── backend/                       # FastAPI backend
│   ├── server.py                 # Main application
│   ├── requirements.txt          # Python dependencies
│   └── .env.example              # Environment template
├── frontend/                      # React frontend
│   ├── src/                      # Source code
│   ├── package.json              # Dependencies
│   └── .env.example              # Environment template
├── vercel.json                    # Vercel configuration
├── .vercelignore                  # Deployment exclusions
└── Documentation/
    ├── QUICK_START.md            # Quick deployment guide
    ├── VERCEL_DEPLOYMENT_GUIDE.md # Complete guide
    ├── VERCEL_CONFIGURATION.md    # Technical details
    └── TROUBLESHOOTING.md         # Issue resolution
```

## 🎯 Features

### For Patients
- ✅ Register and login
- ✅ Submit diabetes data with tongue images
- ✅ View submission history
- ✅ Track blood glucose, HbA1c levels

### For Doctors
- ✅ View all patient submissions
- ✅ Access patient data and images
- ✅ Requires admin approval

### For Admins
- ✅ Approve/reject doctor registrations
- ✅ View system statistics
- ✅ Export data with images (CSV + ZIP)
- ✅ Manage users and submissions

## 🔒 Default Admin Credentials

**⚠️ Change these immediately after deployment!**

```
Email: workwithgrover@gmail.com
Password: win40xp
```

## 🛠️ Technology Stack

- **Frontend**: React 19, Tailwind CSS, Radix UI
- **Backend**: FastAPI, Python 3.11
- **Database**: MongoDB (Atlas for production)
- **Deployment**: Vercel (Serverless)
- **Authentication**: JWT tokens

## 📝 Environment Variables

### Backend Variables
```env
MONGO_URL=mongodb://localhost:27017  # Use Atlas URL for production
DB_NAME=soin_healthcare
SECRET_KEY=your-secret-key-change-in-production
CORS_ORIGINS=*
```

### Frontend Variables
```env
REACT_APP_BACKEND_URL=http://localhost:8001  # Use Vercel URL for production
WDS_SOCKET_PORT=443
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
```

## 🚨 Important Notes for Vercel Deployment

### Limitations (Free Tier)
- **File Upload Limit**: 4.5 MB (may need compression)
- **Function Timeout**: 10 seconds max
- **Cold Starts**: First request may be slow (2-5 seconds)
- **No Persistent Storage**: Use external storage for uploads

### Solutions
- Compress images before upload
- Use MongoDB Atlas (free tier: 512MB)
- Consider Cloudinary/S3 for large files
- Upgrade to Vercel Pro for production use

## 📚 API Documentation

Once deployed, API docs available at:
- Swagger UI: `https://your-app.vercel.app/api/docs`
- ReDoc: `https://your-app.vercel.app/api/redoc`

### Key Endpoints

```
POST /api/auth/register        # Register new user
POST /api/auth/login          # Login
GET  /api/auth/me             # Get current user
POST /api/submissions         # Submit diabetes data
GET  /api/submissions         # Get submissions
GET  /api/admin/stats         # Get statistics (admin)
GET  /api/admin/export-data   # Export all data (admin)
```

## 🧪 Testing

### Test Backend
```bash
cd backend
pytest
```

### Test Frontend
```bash
cd frontend
yarn test
```

### Manual Testing
1. Register as patient
2. Login
3. Submit diabetes data with image
4. Login as admin
5. Approve doctor accounts
6. Export data

## 🐛 Troubleshooting

**Build Fails?**
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Verify all dependencies in package.json
- Check Vercel build logs

**502 Error?**
- Verify MongoDB connection string
- Check network access in MongoDB Atlas
- View Vercel function logs

**Can't Upload Images?**
- Files must be < 4.5 MB
- Implement image compression
- Consider external storage

**See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for complete guide**

## 📖 Documentation Index

1. **[QUICK_START.md](./QUICK_START.md)**
   - 15-minute deployment checklist
   - Step-by-step instructions
   - Essential configuration only

2. **[VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)**
   - Comprehensive deployment guide
   - MongoDB Atlas setup
   - Environment variables
   - Security best practices
   - Troubleshooting

3. **[VERCEL_CONFIGURATION.md](./VERCEL_CONFIGURATION.md)**
   - Technical configuration details
   - File structure explanation
   - Serverless architecture
   - Performance optimization

4. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**
   - Common issues and solutions
   - Debugging tools
   - Pre-deployment checklist
   - Contact information

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Documentation**: Check guides in repository
- **Issues**: Open issue on GitHub
- **Vercel Support**: https://vercel.com/support
- **MongoDB Support**: https://www.mongodb.com/community/forums/

## ⚡ Quick Commands

```bash
# Install dependencies
cd backend && pip install -r requirements.txt
cd frontend && yarn install

# Run locally
cd backend && uvicorn server:app --reload
cd frontend && yarn start

# Build for production
cd frontend && yarn build

# Deploy to Vercel (after setup)
git push origin main  # Auto-deploys if connected

# View logs
vercel logs your-app-name --follow
```

## 🎉 Deployment Success

Once deployed, your app will be available at:
`https://your-app-name.vercel.app`

**Next Steps:**
1. ✅ Test admin login
2. ✅ Change default admin password
3. ✅ Test patient registration
4. ✅ Test data submission
5. ✅ Configure custom domain (optional)
6. ✅ Monitor usage in Vercel dashboard

---

**Built with ❤️ for healthcare professionals and patients**

**Last Updated**: January 2025
