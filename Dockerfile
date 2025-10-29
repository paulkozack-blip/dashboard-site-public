FROM python:3.11-slim

WORKDIR /app

# Копируем зависимости бэкенда
COPY backend/requirements.txt .

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код бэкенда
COPY backend/ .

# Запускаем приложение
CMD ["python", "main.py"]