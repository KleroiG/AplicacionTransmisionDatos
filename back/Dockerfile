FROM python:3.11-slim
WORKDIR /app

# librerías del sistema necesarias (libsndfile para soundfile, build tools)
RUN apt-get update && apt-get install -y \
    build-essential \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# copiar e instalar requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copiar código
COPY . .

# Exponer (documental)
EXPOSE 8000

# Usar PORT si está definido por Railway, si no usar 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
