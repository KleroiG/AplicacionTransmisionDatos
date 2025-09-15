from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi import Form
import numpy as np
import soundfile as sf
import io
import os
from pathlib import Path
from typing import Optional
import matplotlib.pyplot as plt
import tempfile

app = FastAPI(title="Audio PCM-PSK Encoder")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurar paths - manejo robusto del frontend
frontend_path = Path(__file__).parent.parent / "frontend" / "dist"

if frontend_path.exists():
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
    print("Frontend estático montado correctamente")
else:
    print("Frontend no encontrado")

async def serve_frontend():
    index_path = frontend_path / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    
    # Si no hay frontend, mostrar información de la API
    return JSONResponse({
        "message": "Backend de Codificación PCM y Modulación PSK funcionando",
        "status": "success",
        "api_endpoints": {
            "process_audio": "POST /api/process-audio",
            "download_result": "GET /api/download-result",
            "health_check": "GET /api/health"
        },
        "frontend_status": "no_encontrado",
        "instructions": "Ejecuta 'npm run build' en la carpeta frontend/ para construir el frontend"
    })

@app.get("/api/health")
async def health_check():
    """Endpoint de verificación de salud"""
    return {
        "status": "ok", 
        "service": "Audio PCM-PSK Encoder",
        "frontend_available": frontend_path.exists(),
        "endpoints_working": True
    }

@app.post("/api/process-audio")
async def process_audio(file: UploadFile = File(...), bit_depth: int = Form(8), sample_rate: int = Form(44100)):
    try:
        # Leer el archivo de audio
        audio_data, original_sr = sf.read(io.BytesIO(await file.read()))
        
        # Convertir a mono si es estéreo
        if len(audio_data.shape) > 1:
            audio_data = np.mean(audio_data, axis=1)
        
        # Resamplear si es necesario
        if original_sr != sample_rate:
            from scipy import signal
            num_samples = int(len(audio_data) * sample_rate / original_sr)
            audio_data = signal.resample(audio_data, num_samples)
        
        # Codificación PCM
        pcm_encoded = pcm_encoding(audio_data, bit_depth)
        
        # Modulación PSK
        psk_modulated = psk_modulation(pcm_encoded)
        
        # Guardar resultados temporales
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
            # Crear señal de audio para la modulación PSK (simulada)
            time = np.linspace(0, len(psk_modulated)/1000, len(psk_modulated))
            carrier = np.sin(2 * np.pi * 1000 * time)
            modulated_signal = carrier * psk_modulated
            
            # Normalizar y guardar
            modulated_signal = modulated_signal / np.max(np.abs(modulated_signal))
            sf.write(tmp.name, modulated_signal, sample_rate)
            tmp_path = tmp.name
        
        return {
            "message": "Procesamiento completado exitosamente",
            "pcm_samples": pcm_encoded[:100].tolist(),  # Muestra de primeros 100 samples
            "psk_waveform": psk_modulated[:100].tolist(),
            "audio_url": f"/api/download-result?path={tmp_path}",
            "original_sample_rate": original_sr,
            "processed_sample_rate": sample_rate,
            "bit_depth": bit_depth
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

@app.get("/api/download-result")
async def download_result(path: str):
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(
        path, 
        media_type='audio/wav', 
        filename="audio_modulado_psk.wav",
        headers={"Content-Disposition": "attachment; filename=audio_modulado_psk.wav"}
    )

def pcm_encoding(audio_data: np.ndarray, bit_depth: int) -> np.ndarray:
    """Codificación PCM del audio"""
    # Normalizar a [-1, 1]
    normalized = audio_data / np.max(np.abs(audio_data))
    
    # Cuantización
    max_value = 2**(bit_depth - 1) - 1
    quantized = np.round(normalized * max_value)
    
    # Convertir a enteros
    return quantized.astype(np.int16)

def psk_modulation(pcm_data: np.ndarray) -> np.ndarray:
    """Modulación PSK (Phase Shift Keying)"""
    # Convertir datos PCM a binario
    binary_data = np.unpackbits(np.uint8(pcm_data + 128))
    
    # Modulación PSK: 0 = 0°, 1 = 180°
    modulated = np.where(binary_data == 1, 1.0, -1.0)
    
    return modulated

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)