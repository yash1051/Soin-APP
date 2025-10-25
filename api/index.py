# Vercel Serverless Function Handler
# This file adapts the FastAPI app for Vercel's serverless platform

import sys
from pathlib import Path

# Add backend directory to Python path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

# Import the FastAPI app
from server import app

# Vercel requires a handler function
handler = app
