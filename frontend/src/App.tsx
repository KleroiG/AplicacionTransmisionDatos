import React, { useState, useRef, useEffect } from 'react';
import type { ProcessingResults } from './types/audio';
import './App.css';

const AudioProcessor: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [bitDepth, setBitDepth] = useState<number>(8);
  const [sampleRate, setSampleRate] = useState<number>(44100);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [results, setResults] = useState<ProcessingResults | null>(null);
  
  const pcmCanvasRef = useRef<HTMLCanvasElement>(null);
  const pskCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAudioFile(event.target.files[0]);
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
        pcmData: data.pcm_samples,
        pskData: data.psk_waveform,
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
    const ctx = canvas.getContext('2d');
    if (!ctx || data.length === 0) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    const step = canvas.width / data.length;
    const mid = canvas.height / 2;
    const maxAmplitude = Math.max(...data.map(Math.abs), 1);

    ctx.moveTo(0, mid);
    
    for (let i = 0; i < data.length; i++) {
      const x = i * step;
      const y = mid - (data[i] * (mid - 10) / maxAmplitude);
      ctx.lineTo(x, y);
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
  };

  useEffect(() => {
    drawWaveforms();
  }, [results]);

  return (
    <div className="container">
      <h1>Codificador PCM y Modulador PSK</h1>
      
      <div className="upload-section">
        <input 
          type="file" 
          onChange={handleFileUpload} 
          accept="audio/*"
          className="file-input"
        />
        
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
          
          <div className="waveforms">
            <div className="waveform-card">
              <h3>Muestra de Codificación PCM</h3>
              <canvas ref={pcmCanvasRef} width={500} height={250} />
            </div>
            
            <div className="waveform-card">
              <h3>Señal PSK Modulada</h3>
              <canvas ref={pskCanvasRef} width={500} height={250} />
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
    </div>
  );
};

export default AudioProcessor;