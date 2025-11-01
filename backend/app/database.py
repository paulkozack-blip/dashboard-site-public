# backend/app/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Берем из переменных окружения
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./trading_app.db")

# Определяем движок в зависимости от типа базы
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
else:
    # Для PostgreSQL (и других баз) без check_same_thread
    engine = create_engine(SQLALCHEMY_DATABASE_URL)


# engine = create_engine(
#     SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
# )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        

# Функция для создания таблиц и начальных данных
def create_tables_and_admin():
    """Создает таблицы и первого админа"""
    from app.models.user import User, UserRole
    from app.core.security import get_password_hash
    
    # Создаем все таблицы
    Base.metadata.create_all(bind=engine)
    
    # Проверяем, есть ли уже админ
    db = SessionLocal()
    try:
        admin_exists = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not admin_exists:
            # Создаем первого админа
            admin_user = User(
                username="admin",
                password_hash=get_password_hash("admin"),
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(admin_user)
            db.commit()
            print("✅ Создан админ пользователь: admin / admin")
    except Exception as e:
        print(f"❌ Ошибка создания админа: {e}")
        db.rollback()
    finally:
        db.close()