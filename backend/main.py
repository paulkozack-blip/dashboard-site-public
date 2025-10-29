# backend/main.py - точка входа для Railway
import uvicorn
import os
from app.main import app

if __name__ == "__main__":
    PORT = int(os.getenv("PORT", 8000))
    uvicorn.run(
        app,  # ИСПОЛЬЗУЙ ПЕРЕМЕННУЮ app, А НЕ СТРОКУ!
        host="0.0.0.0", 
        port=PORT,
        reload=True if os.getenv("ENV") == "development" else False
    )