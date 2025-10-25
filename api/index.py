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
