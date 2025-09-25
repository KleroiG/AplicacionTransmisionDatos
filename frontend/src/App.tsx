import React, { useState, useRef, useEffect } from 'react';
import type { ProcessingResults } from './types/audio';
import './App.css';
import "./Modal";
import Modal from "./Modal";
import MiniWaveform from "./MiniWaveform";



const AudioProcessor: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [bitDepth, setBitDepth] = useState<number | "">("");
  const [sampleRate, setSampleRate] = useState<number | "">("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [results, setResults] = useState<ProcessingResults | null>(null);

  const pcmCanvasRef = useRef<HTMLCanvasElement>(null);
  const pskCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioCanvasRef = useRef<HTMLCanvasElement>(null);
  const binaryDataCanvasRef = useRef<HTMLCanvasElement>(null);
  const polarDataCanvasRef = useRef<HTMLCanvasElement>(null);
  const carrierCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioVisualizerRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showPolarModal, setShowPolarModal] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);

  const [showPCMModal, setShowPCMModal] = useState(false);
  const [showPSKModal, setShowPSKModal] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const allowedExtensions = ['.wav', '.mp3', '.flac', '.ogg'];
      const maxSize = 20 * 1024 * 1024; // 20 MB

      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        setError(`Formato no válido (${ext}). Usa: ${allowedExtensions.join(', ')}`);
        setAudioFile(null);
        return;
      }

      if (file.size > maxSize) {
        setError(`El archivo es demasiado grande. Máximo permitido: 20 MB`);
        setAudioFile(null);
        return;
      }

      setAudioFile(file);
      setError('');
    }
  };

  const processAudio = async () => {
    if (!audioFile) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('bit_depth', bitDepth.toString());
    formData.append('sample_rate', sampleRate.toString());

    try {
      const response = await fetch('/api/process-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();

      setResults({
        audio_data: data.audio_data,
        pcmData: data.pcm_samples,
        pskData: data.psk_waveform,
        binary_data: data.binary_data,
        polar_data: data.polar_data,
        carrier: data.carrier,
        audioUrl: data.audio_url,

      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al procesar el audio');
      console.error('Error processing audio:', err);
    } finally {
      setLoading(false);
    }
  };

  const drawWaveform = (
  canvas: HTMLCanvasElement,
  data: number[],
  color: string
): void => {
  const ctx = canvas.getContext("2d");
  if (!ctx || data.length === 0) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  const step = Math.ceil(data.length / canvas.width); 
  const mid = canvas.height / 2;

  if (canvas.id === "binary" || canvas.id === "polar") {
    for (let i = 0; i < data.length; i += step) {
      const x = (i / step) * (canvas.width / (data.length / step));
      const y = mid - data[i] * (mid - 20); 
      ctx.lineTo(x, y);
      ctx.lineTo(
        x + canvas.width / (data.length / step),
        y
      ); 
    }
  } else {
    ctx.moveTo(0, mid);
    for (let i = 0; i < data.length; i += step) {
      const x = (i / step) * (canvas.width / (data.length / step));
      const y = mid - (data[i] * (mid - 10)) / Math.max(...data.map(Math.abs), 1);
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
};


  const drawWaveforms = () => {
    if (!results) return;

    if (pcmCanvasRef.current) {
      drawWaveform(pcmCanvasRef.current, results.pcmData, '#3498db');
    }

    if (pskCanvasRef.current) {
      drawWaveform(pskCanvasRef.current, results.pskData, '#e74c3c');
    }

    if (audioCanvasRef.current) {
      drawWaveform(audioCanvasRef.current, results.audio_data, '#b13ce7ff');
    }

    if (binaryDataCanvasRef.current) {
      drawWaveform(binaryDataCanvasRef.current, results.binary_data, '#e73caeff');
    }

    if (polarDataCanvasRef.current) {
      drawWaveform(polarDataCanvasRef.current, results.polar_data, '#5ee73cff');
    }

    if (carrierCanvasRef.current) {
      drawWaveform(carrierCanvasRef.current, results.carrier, '#d0e73cff');
    }
  };

  useEffect(() => {
    drawWaveforms();
  }, [results]);
useEffect(() => {
  if (!results?.audioUrl) return;

  const audioEl = audioRef.current;
  const canvas = audioVisualizerRef.current;
  if (!audioEl || !canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const audioCtx = new AudioContext();
  const analyser = audioCtx.createAnalyser();
  const source = audioCtx.createMediaElementSource(audioEl);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  analyser.fftSize = 2048;
  const bufferLength = analyser.fftSize;
  const dataArray = new Uint8Array(bufferLength);

  const draw = () => {
    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#8e44ad";
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0; // Normalizar 0-2
      const y = (v * canvas.height) / 2;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };

  draw();

  return () => {
    audioCtx.close();
  };
}, [results?.audioUrl]);

  return (
    <div className="container">
      <h1 className="main-title">Codificador PCM y Modulador PSK</h1>
<p className="subtitle">Sube un archivo de audio, selecciona parámetros y procesa</p>

{/* Imagen decorativa */}
<div className="image-container">
  <img src="public/waveform.png" alt="Waveform Icon" className="decorative-image" />
</div>

      <div className="upload-section">
        <div className="file-input-wrapper">
          <input
            type="file"
            id="file-upload"
            className="file-input"
            onChange={handleFileUpload}
            accept="audio/*"
          />
          <label htmlFor="file-upload" className="file-label">
            📂 Seleccionar archivo
          </label>
          {audioFile && <p className="file-name">Archivo: {audioFile.name}</p>}
          <p className="file-info">Formatos permitidos: WAV, MP3, FLAC, OGG</p>
        </div>
<div className="dropdown-row">
  <div className="custom-dropdown">
    <label htmlFor="bitDepth">
      Profundidad de bits:
      <span className="tooltip">ℹ️
        <span className="tooltiptext">Número de bits usados por muestra (8 o 16)</span>
      </span>
    </label>
    <select
      id="bitDepth"
      value={bitDepth}
      onChange={(e) => setBitDepth(Number(e.target.value))}
      className="custom-select"
    >
      <option value="" disabled>Seleccionar</option>
      <option value="8">8 bits</option>
      <option value="16">16 bits</option>
    </select>
  </div>

  <div className="custom-dropdown">
    <label htmlFor="sampleRate">
      Sample rate:
      <span className="tooltip">ℹ️
        <span className="tooltiptext">Frecuencia de muestreo (44.1, 48 o 96 kHz)</span>
      </span>
    </label>
    <select
      id="sampleRate"
      value={sampleRate}
      onChange={(e) => setSampleRate(Number(e.target.value))}
      className="custom-select"
    >
      <option value="" disabled>Seleccionar</option>
      <option value="44100">44.1 kHz</option>
      <option value="48000">48 kHz</option>
      <option value="96000">96 kHz</option>
    </select>
  </div>
</div>

      <button
  onClick={processAudio}
  disabled={!audioFile || loading}
  className="process-btn"
>
  {loading ? <div className="spinner"></div> : "Procesar Audio"}
</button>

      </div>
{/* Botón para abrir el glosario */}
<button
  className="glossary-btn"
  onClick={() => setShowGlossary(true)}
>
  📖 Glosario de Términos
</button>

{/* Modal del glosario */}
<Modal show={showGlossary} onClose={() => setShowGlossary(false)}>
  <h2 className="text-xl font-bold mb-4">Glosario de Señales</h2>
  <div className="flex flex-col gap-2">
    <p><strong>Señal Original:</strong> La señal de audio tal como fue subida por el usuario.</p>
    <p><strong>PCM:</strong> Pulse Code Modulation. Codificación digital de la señal de audio.</p>
    <p><strong>Polar:</strong> Representación de la señal en valores +1/-1 antes de la modulación PSK.</p>
    <p><strong>PSK:</strong> Phase Shift Keying. Modulación que cambia la fase de la portadora según la señal polarizada.</p>
    <p><strong>Carrier (Portadora):</strong> Señal base que se modula con la señal polarizada para obtener PSK.</p>
    <p><strong>Audio Modulado:</strong> Resultado final de aplicar PCM y PSK al audio original.</p>
  </div>
</Modal>
      {error && <div className="error-message">{error}</div>}

      {results && (
        <div className="results-section animate-fadein">
          <h2>Resultados del Procesamiento</h2>

          <div className="diagram">
            <MiniWaveform data={results.audio_data} color="#8e44ad" type="line"/>
            <div className="diagram-step" onClick={() => setShowPCMModal(true)} >PCM</div>

            <MiniWaveform data={results.pcmData} color="#3498db" type="line" />
            <div className="diagram-step cursor-pointer" onClick={() => setShowPolarModal(true)} >Polar</div>

            <MiniWaveform data={results.polar_data} color="#22e64dff" type="step"/>
            <div className="diagram-step" onClick={() => setShowPSKModal(true)}>PSK</div>

            <MiniWaveform data={results.pskData} color="#e74c3c" type="line" />
          </div>
          <div className="waveforms">

            <div className="waveform-card">
              <h3>Señal Original</h3>
              <canvas ref={audioCanvasRef} width={500} height={250} />
            </div>

            <div className="waveform-card">
              <h3>Muestra de Codificación PCM</h3>
              <canvas ref={pcmCanvasRef} width={500} height={250} />
            </div>

            <div className="waveform-card">
              <h3>Señal entra a polar</h3>
              <canvas ref={binaryDataCanvasRef} width={500} height={250} />
            </div>

            <div className="waveform-card">
              <h3>Señal sale de polar</h3>
              <canvas id="polar" ref={polarDataCanvasRef} width={500} height={250} />
            </div>

            <div className="waveform-card">
              <h3>Señal PSK Modulada</h3>
              <canvas ref={pskCanvasRef} width={500} height={250} />
            </div>

            <div className="waveform-card">
              <h3>Carrier</h3>
              <canvas ref={carrierCanvasRef} width={500} height={250} />
            </div>

          </div>

          <div className="audio-player">
            <h3>Audio Modulado Resultante</h3>
            <audio ref={audioRef} controls>
              <source src={results.audioUrl} type="audio/wav" />
              Tu navegador no soporta el elemento de audio.
            </audio>

<canvas
  ref={audioVisualizerRef}
  width={500}
  height={100}
  style={{ width: "100%", border: "1px solid #ccc", marginTop: "10px" }}
/>


            <a
              href={results.audioUrl}
              download="audio_modulado_psk.wav"
              className="download-btn"
            >
              <button>⬇️ Descargar Audio Modulado</button>
            </a>
          </div>
        </div>
      )}


      <Modal show={showPolarModal} onClose={() => setShowPolarModal(false)}>
      <h2 className="text-xl font-bold mb-4">Señales en Polar → PSK</h2>
      <div className="flex flex-col gap-4">
        <div>
          <h3>No cuenta con portadora.</h3>
        </div>
        <div>
          <h3>Señal Moduladora</h3>
          <MiniWaveform
            data={results?.polar_data || []}
            color="#e74c3c"
            type="line"
            width={500}
            height={200}
          />
        </div>
        <div>
          <h3>Señal Modulada</h3>
          <MiniWaveform
            data={results?.polar_data || []}
            color="#3ce753ff"
            type="line"
            width={500}
            height={200}
          />
          
        </div>
      </div>
    </Modal>

    <Modal show={showPCMModal} onClose={() => setShowPCMModal(false)}>
      <h2 className="text-xl font-bold mb-4">Señal Original → PCM</h2>
      <div className="flex flex-col gap-4">
        <div>
          <h3>No cuenta con portadora. </h3>
          
        </div>
        <div>
          <h3>Señal Moduladora</h3>
          <MiniWaveform
            data={results?.audio_data || []}
            color="#e74c3c"
            type="line"
            width={500}
            height={200}
          />
        </div>
        <div>
          <h3>Señal Modulada</h3>
          <MiniWaveform
            data={results?.pcmData || []}
            color="#3ce7abff"
            type="line"
            width={500}
            height={200}
          />
        </div>
      </div>
    </Modal>

    <Modal show={showPSKModal} onClose={() => setShowPSKModal(false)}>
      <h2 className="text-xl font-bold mb-4">Señal Polar → PSK</h2>
      <div className="flex flex-col gap-4">
        <div>
          <h3>Señal Portadora</h3>
          <MiniWaveform
            data={results?.carrier || []}
            color="#e74c3c"
            type="line"
            width={500}
            height={200}
          />
          
        </div>
        <div>
          <h3>Señal Moduladora</h3>
          <MiniWaveform
            data={results?.polar_data || []}
            color="#e74c3c"
            type="line"
            width={500}
            height={200}
          />
        </div>
        <div>
          <h3>Señal Modulada</h3>
          <MiniWaveform
            data={results?.pskData || []}
            color="#3ce7abff"
            type="line"
            width={500}
            height={200}
          />
        </div>
      </div>
    </Modal>

    </div>
  );
};

export default AudioProcessor;