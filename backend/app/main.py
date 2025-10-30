# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

# Получаем порт из переменных окружения (для Railway)
PORT = int(os.getenv("PORT", 8000))

# Создаем директории
os.makedirs(os.getenv("UPLOAD_DIR", "./uploads"), exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    from app.database import create_tables_and_admin
    create_tables_and_admin()
    yield
    # Shutdown
    pass

app = FastAPI(
    title="Analytics API",
    description="API для приложения с системой инвайтов",
    version="1.0.0",
    lifespan=lifespan
)

# CORS настройки
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://dashboard-site-pmlu.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # ЗАМЕНИЛИ "*" на origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем статические файлы
app.mount("/uploads", StaticFiles(directory=os.getenv("UPLOAD_DIR", "./uploads")), name="uploads")

# Импортируем роутеры
from app.api.routes import auth, users, charts, invites, admin

# Подключаем роутеры
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(charts.router, prefix="/charts", tags=["Charts"])
app.include_router(invites.router, prefix="/invites", tags=["Invites"])

@app.get("/")
async def root():
    return {"message": "Trading Analytics API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,  
        host="0.0.0.0", 
        port=PORT,   
        reload=True if os.getenv("ENV") == "development" else False
    )