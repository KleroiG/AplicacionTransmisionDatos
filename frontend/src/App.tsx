import { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [audio, setAudio] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("nbits", "8");
    formData.append("fc", "2000");
    formData.append("sps", "16");

    try {
      const res = await axios.post("http://localhost:8000/process", formData);

      const imgHex: string = res.data.image;
      const audioHex: string = res.data.audio;

      const imgBlob = new Blob(
        [Uint8Array.from(Buffer.from(imgHex, "hex"))],
        { type: "image/png" }
      );
      const audioBlob = new Blob(
        [Uint8Array.from(Buffer.from(audioHex, "hex"))],
        { type: "audio/wav" }
      );

      setImage(URL.createObjectURL(imgBlob));
      setAudio(URL.createObjectURL(audioBlob));
    } catch (err) {
      console.error("Error procesando el archivo:", err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Codificación PCM + Modulación PSK</h1>

      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleUpload}>Procesar</button>

      {image && (
        <div>
          <h2>Señal modulada:</h2>
          <img src={image} alt="Gráfico de señal" />
        </div>
      )}

      {audio && (
        <div>
          <h2>Audio modulado:</h2>
          <audio controls src={audio}></audio>
        </div>
      )}
    </div>
  );
}

export default App;
