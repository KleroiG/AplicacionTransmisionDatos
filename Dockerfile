FROM python:3.11-slim

WORKDIR /app

# Dependencias del sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements del backend
COPY back/requirements.txt ./requirements.txt
RUN python -m pip install --upgrade pip
RUN python -m pip install --no-cache-dir -r requirements.txt

# Copiar backend y frontend
COPY back/ ./back
COPY frontend/ ./frontend

# Exponer puerto
EXPOSE 8000

# Comando para ejecutar backend (Railway define $PORT)
CMD ["sh", "-c", "uvicorn back.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
