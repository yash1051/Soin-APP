from mangum import Mangum
import sys
import os
from pathlib import Path

# Set environment variable to indicate we're running on Vercel
os.environ['VERCEL'] = 'true'

# Add backend directory to Python path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

# Import the FastAPI app
from server import app

# Create handler for Vercel serverless
handler = Mangum(app, lifespan="off")

