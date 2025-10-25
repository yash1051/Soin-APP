"""
Vercel-specific compatibility fixes for serverless deployment
This module handles differences between local and serverless environments
"""

import os
from pathlib import Path
import tempfile

def get_upload_directory():
    """
    Get upload directory that works in both local and serverless environments
    In serverless (Vercel), this will use /tmp which is ephemeral
    """
    if os.environ.get('VERCEL'):
        # Use /tmp in Vercel (ephemeral storage)
        upload_dir = Path('/tmp/uploads/tongue_images')
    else:
        # Use local directory for development
        upload_dir = Path(__file__).parent / 'uploads' / 'tongue_images'
    
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir

def is_serverless():
    """Check if running in serverless environment"""
    return os.environ.get('VERCEL') is not None or os.environ.get('AWS_LAMBDA_FUNCTION_NAME') is not None

# Warning about file storage in serverless
FILE_STORAGE_WARNING = """
⚠️ WARNING: File uploads in serverless environment (Vercel) are stored in /tmp
and will be DELETED after function execution completes.

For production use, you MUST implement external storage:
- Vercel Blob Storage
- AWS S3
- Cloudinary
- Supabase Storage

See VERCEL_DEPLOYMENT_GUIDE.md for implementation details.
"""
