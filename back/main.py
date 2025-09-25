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
    app.mount("/app", StaticFiles(directory=frontend_path, html=True), name="frontend")
    print("Frontend estático montado en /app")
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
async def process_audio(
    file: UploadFile = File(...),
    bit_depth: int = Form(8),
    sample_rate: int = Form(44100)
):
    try:
        # ✅ Validar extensión
        allowed_extensions = {".wav", ".mp3", ".flac", ".ogg"}
        ext = Path(file.filename).suffix.lower()
        if ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Formato de archivo no soportado ({ext}). "
                       f"Formatos permitidos: {', '.join(allowed_extensions)}"
            )

        # ✅ Validar tamaño (20 MB máx)
        max_size = 20 * 1024 * 1024
        audio_bytes = await file.read()
        if len(audio_bytes) > max_size:
            raise HTTPException(
                status_code=413,
                detail=f"El archivo excede el tamaño máximo permitido (20 MB)"
            )

        print(f"Procesando archivo: {file.filename}, bit_depth={bit_depth}, sample_rate={sample_rate}")
        print(f"Tamaño del archivo recibido: {len(audio_bytes)} bytes")

        # Leer con soundfile
        try:
            audio_data, original_sr = sf.read(io.BytesIO(audio_bytes))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"No se pudo leer el audio: {str(e)}")

        print(f"Archivo leído con sample_rate original: {original_sr}, forma: {audio_data.shape}")

        # Convertir a mono si es estéreo
        if len(audio_data.shape) > 1:
            print("Audio estéreo detectado → convirtiendo a mono")
            audio_data = np.mean(audio_data, axis=1)

        if len(audio_data.shape) > 1:
            print("Audio estéreo detectado → convirtiendo a mono")
            audio_data = np.mean(audio_data, axis=1)

        if original_sr != sample_rate:
            from scipy import signal
            num_samples = int(len(audio_data) * sample_rate / original_sr)
            print(f"Resampleando de {original_sr} Hz a {sample_rate} Hz ({num_samples} muestras)")
            audio_data = signal.resample(audio_data, num_samples)

        print("Iniciando codificación PCM…")
        pcm_encoded = pcm_encoding(audio_data, bit_depth)
        print("Codificación PCM completada")

        print("Iniciando modulación PSK…")
        binary_data, polar_data, psk_modulated, carrier = psk_modulation(pcm_encoded)
        print("Modulación PSK completada")

        # Guardar resultados temporales
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
            time = np.linspace(0, len(psk_modulated) / 1000, len(psk_modulated))
            carrier = np.sin(2 * np.pi * 1000 * time)
            modulated_signal = carrier * psk_modulated

            modulated_signal = modulated_signal / np.max(np.abs(modulated_signal))
            sf.write(tmp.name, modulated_signal, sample_rate)
            tmp_path = tmp.name
            print(f"Archivo modulado guardado en {tmp_path}")

        num_points = 1000  # cantidad de puntos para graficar

        # Original
        indices_original = np.linspace(0, len(audio_data) - 1, num_points, dtype=int)
        original_downsampled = audio_data[indices_original]

        # PCM
        indices_pcm = np.linspace(0, len(pcm_encoded) - 1, num_points, dtype=int)
        pcm_downsampled = pcm_encoded[indices_pcm]

        # PSK
        num_points_psk = 100
        indices_psk = np.linspace(0, len(psk_modulated) - 1, num_points_psk, dtype=int)
        psk_downsampled = psk_modulated[indices_psk]

        #binary
        indices_binary = np.linspace(0, len(binary_data) - 1, num_points_psk, dtype=int)
        binary_downsampled = binary_data[indices_binary]

        #polar
        indices_polar = np.linspace(0, len(polar_data) - 1, num_points_psk, dtype=int)
        polar_downsampled = polar_data[indices_polar]

        carrier_index = np.linspace(0, len(carrier) - 1, num_points_psk, dtype=int)
        carrier_downsampled = carrier[carrier_index]

        return {
            "message": "Procesamiento completado exitosamente",
            "audio_data": original_downsampled.tolist(),    
            "pcm_samples": pcm_downsampled.tolist(),       
            "psk_waveform": psk_downsampled.tolist(),
            "binary_data": binary_downsampled.tolist(), 
            "polar_data": polar_downsampled.tolist(), 
            "carrier": carrier_downsampled.tolist(),

            
            "audio_url": f"/api/download-result?path={tmp_path}",
            "original_sample_rate": original_sr,
            "processed_sample_rate": sample_rate,
            "bit_depth": bit_depth
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print("❌ ERROR en process_audio:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno procesando audio: {str(e)}")


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

def psk_modulation(pcm_data: np.ndarray):
    """Codificación Polar + Modulación PSK"""
    # Binario crudo
    binary_data = np.unpackbits(np.uint8(pcm_data + 128))  

    # Código polar (0→-1, 1→+1)
    polar_data = np.where(binary_data == 1, 1.0, -1.0)

    # Señal PSK: multiplicar portadora
    sample_rate = 44100
    t = np.linspace(0, len(polar_data) / sample_rate, num=len(polar_data))
    carrier = np.sin(2 * np.pi * 1000 * t)
    modulated = polar_data * carrier

    return binary_data, polar_data, modulated, carrier

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)