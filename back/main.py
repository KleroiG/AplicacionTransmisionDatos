from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import FileResponse, StreamingResponse
from processing import pcm_psk_process
from io import BytesIO

app = FastAPI()

@app.post("/process")
async def process_audio(
    file: UploadFile,
    nbits: int = Form(8),
    fc: int = Form(2000),
    sps: int = Form(16)
):
    file_bytes = await file.read()
    wav_buf, img_buf = pcm_psk_process(file_bytes, nbits, fc, sps)

    return {
        "audio": wav_buf.getvalue().hex(),
        "image": img_buf.getvalue().hex()
    }
