import numpy as np
import matplotlib.pyplot as plt
import soundfile as sf
from io import BytesIO

def pcm_psk_process(file_bytes, nbits=8, fc=2000, sps=16):
    # Leer audio
    data, fs = sf.read(BytesIO(file_bytes))
    if data.ndim > 1:
        data = data[:,0]  # mono

    # Normalizar
    x = data / np.max(np.abs(data))

    # --- PCM cuantización ---
    L = 2**nbits
    x_clip = np.clip(x, -1, 1 - 1e-12)
    idx = np.floor((x_clip + 1) * (L/2)).astype(int)
    bits = ((idx[:, None] >> np.arange(nbits-1, -1, -1)) & 1).astype(np.uint8).reshape(-1)

    # --- Modulación BPSK ---
    symbols = 2*bits - 1
    tx = np.repeat(symbols, sps)        # señal moduladora (banda base)
    fs_tx = fs * sps
    t_tx = np.arange(len(tx)) / fs_tx
    carrier = np.cos(2*np.pi*fc*t_tx)   # señal portadora
    tx_passband = tx * carrier          # señal modulada BPSK

    # Guardar audio modulado en buffer
    wav_buf = BytesIO()
    sf.write(wav_buf, tx_passband, fs_tx, format="WAV")
    wav_buf.seek(0)

    # --- Gráfico comparativo ---
    img_buf = BytesIO()
    plt.figure(figsize=(10,6))

    plt.subplot(3,1,1)
    plt.plot(t_tx[:500], carrier[:500])
    plt.title("Portadora (coseno)")
    plt.ylabel("Amplitud")

    plt.subplot(3,1,2)
    plt.plot(t_tx[:500], tx[:500])
    plt.title("Señal moduladora (bits en banda base)")
    plt.ylabel("Nivel")

    plt.subplot(3,1,3)
    plt.plot(t_tx[:500], tx_passband[:500])
    plt.title("Señal modulada BPSK")
    plt.xlabel("Tiempo [s]")
    plt.ylabel("Amplitud")

    plt.tight_layout()
    plt.savefig(img_buf, format="png")
    plt.close()
    img_buf.seek(0)

    # Retornar audio + señales
    return {
        "wav_buf": wav_buf,
        "img_buf": img_buf,
        "carrier": carrier[:1000].tolist(),     # portadora (trozo para graficar)
        "moduladora": tx[:1000].tolist(),       # señal moduladora
        "modulada": tx_passband[:1000].tolist() # señal modulada
    }