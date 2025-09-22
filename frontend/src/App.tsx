import React, { useState, useRef, useEffect } from 'react';
import type { ProcessingResults } from './types/audio';
import './App.css';
import "./Modal";
import Modal from "./Modal";
import MiniWaveform from "./MiniWaveform";



const AudioProcessor: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [bitDepth, setBitDepth] = useState<number>(8);
  const [sampleRate, setSampleRate] = useState<number>(44100);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [results, setResults] = useState<ProcessingResults | null>(null);

  const pcmCanvasRef = useRef<HTMLCanvasElement>(null);
  const pskCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioCanvasRef = useRef<HTMLCanvasElement>(null);
  const binaryDataCanvasRef = useRef<HTMLCanvasElement>(null);
  const polarDataCanvasRef = useRef<HTMLCanvasElement>(null);
  const carrierCanvasRef = useRef<HTMLCanvasElement>(null);
  const [showPolarModal, setShowPolarModal] = useState(false);
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

  return (
    <div className="container">
      <h1>Codificador PCM y Modulador PSK</h1>
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
        </div>

        <div className="controls">
          <div className="control-group">
            <label htmlFor="bitDepth">Profundidad de bits:</label>
            <select
              id="bitDepth"
              value={bitDepth}
              onChange={(e) => setBitDepth(Number(e.target.value))}
            >
              <option value="8">8 bits</option>
              <option value="16">16 bits</option>
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="sampleRate">Sample rate:</label>
            <select
              id="sampleRate"
              value={sampleRate}
              onChange={(e) => setSampleRate(Number(e.target.value))}
            >
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
          {loading ? 'Procesando...' : 'Procesar Audio'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {results && (
        <div className="results-section">
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
            <audio controls>
              <source src={results.audioUrl} type="audio/wav" />
              Tu navegador no soporta el elemento de audio.
            </audio>

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