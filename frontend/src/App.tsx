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

<<<<<<< HEAD
  const pcmCanvasRef = useRef<HTMLCanvasElement>(null);
  const pskCanvasRef = useRef<HTMLCanvasElement>(null);
=======
  const pcmCanvasRef = useRef<HTMLCanvasElement>(null)
  const pskCanvasRef = useRef<HTMLCanvasElement>(null)
  const audioCanvasRef = useRef<HTMLCanvasElement>(null)
  const binaryDataCanvasRef = useRef<HTMLCanvasElement>(null)
  const polarDataCanvasRef = useRef<HTMLCanvasElement>(null)
  const carrierCanvasRef = useRef<HTMLCanvasElement>(null)
  const audioVisualizerRef = useRef<HTMLCanvasElement>(null)
  const modulatedAudioRef = useRef<HTMLAudioElement>(null)
  const [currentAudioTime, setCurrentAudioTime] = useState<number>(0)
  const [audioIsPlaying, setAudioIsPlaying] = useState<boolean>(false)
  const [showPolarModal, setShowPolarModal] = useState(false)
  const [showPCMModal, setShowPCMModal] = useState(false)
  const [showPSKModal, setShowPSKModal] = useState(false)
  const [showAudioModal, setShowAudioModal] = useState(false)
  const [showBinaryModal, setShowBinaryModal] = useState(false)
  const [showCarrierModal, setShowCarrierModal] = useState(false)
  const [showModulatedAudioModal, setShowModulatedAudioModal] = useState(false)
>>>>>>> 20f4caf5 (feat: Mejorar el procesamiento de audio con visualización dinámica de forma de onda PSK y controles de reproducción de audio)

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

<<<<<<< HEAD
  const drawWaveforms = () => {
    if (!results) return;
=======
  const drawDynamicPSKWaveform = (
    canvas: HTMLCanvasElement,
    data: number[],
    color: string,
    currentTime: number,
    audioDuration: number
  ): void => {
    const ctx = canvas.getContext("2d")
    if (!ctx || data.length === 0 || audioDuration === 0) {
      console.log("drawDynamicPSKWaveform: Invalid params", {
        hasCtx: !!ctx,
        dataLength: data.length,
        audioDuration,
      })
      return
    }

    console.log("Drawing dynamic PSK waveform", {
      currentTime,
      audioDuration,
      dataLength: data.length,
    })

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const mid = canvas.height / 2
    const maxAmplitude = Math.max(...data.map(Math.abs), 1)

    // Dibujar la señal completa con opacidad reducida como fondo
    ctx.globalAlpha = 0.2
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 1

    const totalStep = Math.max(1, Math.ceil(data.length / canvas.width))
    ctx.moveTo(0, mid)
    for (let i = 0; i < data.length; i += totalStep) {
      const x = (i / data.length) * canvas.width
      const y = mid - (data[i] * (mid - 10)) / maxAmplitude
      ctx.lineTo(x, y)
    }
    ctx.stroke()

    // Calcular progreso del tiempo
    const timeProgress = Math.min(1, Math.max(0, currentTime / audioDuration))

    // Definir ventana de visualización (5% del total hacia cada lado)
    const windowSize = 0.05 // 5% del total
    const startProgress = Math.max(0, timeProgress - windowSize)
    const endProgress = Math.min(1, timeProgress + windowSize)

    const startIndex = Math.floor(startProgress * data.length)
    const endIndex = Math.ceil(endProgress * data.length)

    // Dibujar la ventana actual con mayor opacidad
    if (startIndex < endIndex && endIndex <= data.length) {
      ctx.globalAlpha = 1
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 3

      const windowData = data.slice(startIndex, endIndex)
      const windowStep = Math.max(
        1,
        Math.ceil(windowData.length / (canvas.width * 0.1))
      ) // Más puntos para la ventana

      let firstPoint = true
      for (let i = 0; i < windowData.length; i += windowStep) {
        const globalIndex = startIndex + i
        const x = (globalIndex / data.length) * canvas.width
        const y = mid - (windowData[i] * (mid - 10)) / maxAmplitude

        if (firstPoint) {
          ctx.moveTo(x, y)
          firstPoint = false
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()
    }

    // Dibujar línea de progreso
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.strokeStyle = "#ff0000"
    ctx.lineWidth = 3
    const progressX = timeProgress * canvas.width
    ctx.moveTo(progressX, 0)
    ctx.lineTo(progressX, canvas.height)
    ctx.stroke()

    // Dibujar indicador de tiempo
    ctx.globalAlpha = 1
    ctx.fillStyle = "#ff0000"
    ctx.font = "12px Arial"
    ctx.fillText(
      `${currentTime.toFixed(1)}s / ${audioDuration.toFixed(1)}s`,
      10,
      20
    )

    ctx.globalAlpha = 1
  }

  const drawWaveforms = React.useCallback(() => {
    if (!results) return
>>>>>>> 20f4caf5 (feat: Mejorar el procesamiento de audio con visualización dinámica de forma de onda PSK y controles de reproducción de audio)

    if (pcmCanvasRef.current) {
      drawWaveform(pcmCanvasRef.current, results.pcmData, '#3498db');
    }

    if (pskCanvasRef.current) {
      drawWaveform(pskCanvasRef.current, results.pskData, '#e74c3c');
    }
<<<<<<< HEAD
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
=======

    if (audioCanvasRef.current) {
      drawWaveform(audioCanvasRef.current, results.audio_data, "#b13ce7ff")
    }

    if (binaryDataCanvasRef.current) {
      drawWaveform(
        binaryDataCanvasRef.current,
        results.binary_data,
        "#e73caeff"
      )
    }

    if (polarDataCanvasRef.current) {
      drawWaveform(polarDataCanvasRef.current, results.polar_data, "#5ee73cff")
    }

    if (carrierCanvasRef.current) {
      drawWaveform(carrierCanvasRef.current, results.carrier, "#d0e73cff")
    }
  }, [results])

  const updateAudioVisualizer = React.useCallback(() => {
    if (!results || !audioVisualizerRef.current) {
      console.log("Missing results or canvas ref")
      return
    }

    const audio = modulatedAudioRef.current
    if (!audio) {
      console.log("No audio element found")
      drawWaveform(audioVisualizerRef.current, results.pskData, "#e74c3c")
      return
    }

    const duration = audio.duration
    console.log("updateAudioVisualizer called", {
      hasResults: !!results,
      hasCanvas: !!audioVisualizerRef.current,
      hasAudio: !!audio,
      isPlaying: audioIsPlaying,
      currentTime: currentAudioTime,
      duration: duration,
      audioPaused: audio.paused,
      audioEnded: audio.ended,
    })

    if (!audioIsPlaying || audio.paused || !duration || duration <= 0) {
      // Mostrar visualización estática cuando no se está reproduciendo
      console.log("Drawing static waveform - not playing or invalid duration")
      drawWaveform(audioVisualizerRef.current, results.pskData, "#e74c3c")
      return
    }

    console.log("Drawing dynamic waveform", {
      currentTime: currentAudioTime,
      duration,
    })
    drawDynamicPSKWaveform(
      audioVisualizerRef.current,
      results.pskData,
      "#e74c3c",
      currentAudioTime,
      duration
    )
  }, [results, currentAudioTime, audioIsPlaying])

  useEffect(() => {
    drawWaveforms()
  }, [drawWaveforms])

  useEffect(() => {
    updateAudioVisualizer()
  }, [updateAudioVisualizer])

  useEffect(() => {
    const audio = modulatedAudioRef.current
    if (!audio || !results) {
      console.log("Audio ref not found or no results")
      return
    }

    console.log("Setting up audio event listeners")

    const handleTimeUpdate = () => {
      const isPlaying = !audio.paused && !audio.ended && audio.readyState > 2
      console.log(
        "Time update:",
        audio.currentTime,
        "Playing:",
        isPlaying,
        "Duration:",
        audio.duration
      )
      setCurrentAudioTime(audio.currentTime)
      setAudioIsPlaying(isPlaying)
    }

    const handlePlay = () => {
      console.log("Audio started playing")
      setAudioIsPlaying(true)
    }

    const handlePause = () => {
      console.log("Audio paused")
      setAudioIsPlaying(false)
    }

    const handleEnded = () => {
      console.log("Audio ended")
      setAudioIsPlaying(false)
      setCurrentAudioTime(0)
    }

    const handleLoadedMetadata = () => {
      console.log("Audio metadata loaded, duration:", audio.duration)
      // Forzar una actualización inicial
      setCurrentAudioTime(0)
      setAudioIsPlaying(false)
    }

    const handleCanPlay = () => {
      console.log("Audio can play")
    }

    const handleWaiting = () => {
      console.log("Audio waiting")
    }

    const handlePlaying = () => {
      console.log("Audio is playing")
      setAudioIsPlaying(true)
    }

    // Remover listeners existentes primero
    audio.removeEventListener("timeupdate", handleTimeUpdate)
    audio.removeEventListener("play", handlePlay)
    audio.removeEventListener("pause", handlePause)
    audio.removeEventListener("ended", handleEnded)
    audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
    audio.removeEventListener("canplay", handleCanPlay)
    audio.removeEventListener("waiting", handleWaiting)
    audio.removeEventListener("playing", handlePlaying)

    // Agregar listeners
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("waiting", handleWaiting)
    audio.addEventListener("playing", handlePlaying)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("waiting", handleWaiting)
      audio.removeEventListener("playing", handlePlaying)
    }
  }, [results])

  return (
    <>
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
            {audioFile && (
              <div className="file-info">
                <p className="file-name">Archivo: {audioFile.name}</p>
                <audio
                  controls
                  className="original-audio"
                  key={`original-${audioFile.name}-${audioFile.lastModified}`}
                >
                  <source
                    src={URL.createObjectURL(audioFile)}
                    type={audioFile.type}
                  />
                  Tu navegador no soporta el elemento de audio.
                </audio>
              </div>
            )}
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
            {loading ? "Procesando..." : "Procesar Audio"}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {results && (
          <div className="results-section">
            <h2>Resultados del Procesamiento</h2>

            <div className="diagram">
              <MiniWaveform
                data={results.audio_data}
                color="#8e44ad"
                type="line"
              />
              <div
                className="diagram-step cursor-pointer"
                onClick={() => setShowPCMModal(true)}
              >
                PCM
              </div>

              <MiniWaveform
                data={results.pcmData}
                color="#3498db"
                type="line"
              />
              <div
                className="diagram-step cursor-pointer"
                onClick={() => setShowPolarModal(true)}
              >
                Polar
              </div>

              <MiniWaveform
                data={results.polar_data}
                color="#22e64dff"
                type="step"
              />
              <div
                className="diagram-step cursor-pointer"
                onClick={() => setShowPSKModal(true)}
              >
                PSK
              </div>

              <MiniWaveform
                data={results.pskData}
                color="#e74c3c"
                type="line"
              />
            </div>
            <div className="waveforms">
              <div
                className="waveform-card cursor-pointer"
                onClick={() => setShowAudioModal(true)}
              >
                <h3>Señal Original</h3>
                <canvas ref={audioCanvasRef} width={500} height={250} />
              </div>

              <div
                className="waveform-card cursor-pointer"
                onClick={() => setShowPCMModal(true)}
              >
                <h3>Muestra de Codificación PCM</h3>
                <canvas ref={pcmCanvasRef} width={500} height={250} />
              </div>

              <div
                className="waveform-card cursor-pointer"
                onClick={() => setShowBinaryModal(true)}
              >
                <h3>Señal entra a polar</h3>
                <canvas ref={binaryDataCanvasRef} width={500} height={250} />
              </div>

              <div
                className="waveform-card cursor-pointer"
                onClick={() => setShowPolarModal(true)}
              >
                <h3>Señal sale de polar</h3>
                <canvas
                  id="polar"
                  ref={polarDataCanvasRef}
                  width={500}
                  height={250}
                />
              </div>

              <div
                className="waveform-card cursor-pointer"
                onClick={() => setShowPSKModal(true)}
              >
                <h3>Señal PSK Modulada</h3>
                <canvas ref={pskCanvasRef} width={500} height={250} />
              </div>

              <div
                className="waveform-card cursor-pointer"
                onClick={() => setShowCarrierModal(true)}
              >
                <h3>Carrier</h3>
                <canvas ref={carrierCanvasRef} width={500} height={250} />
              </div>
            </div>

            <div className="audio-player">
              <h3>Audio Modulado Resultante</h3>
              <audio
                ref={modulatedAudioRef}
                controls
                key={`modulated-${results.audioUrl}`}
                preload="metadata"
              >
                <source src={results.audioUrl} type="audio/wav" />
                Tu navegador no soporta el elemento de audio.
              </audio>
>>>>>>> 20f4caf5 (feat: Mejorar el procesamiento de audio con visualización dinámica de forma de onda PSK y controles de reproducción de audio)

              <div
                className="waveform-card cursor-pointer"
                onClick={() => setShowModulatedAudioModal(true)}
                style={{ marginTop: "15px" }}
              >
                <h4>Visualización de la Señal Modulada PSK</h4>
                <canvas
                  ref={audioVisualizerRef}
                  width={500}
                  height={100}
                  style={{
                    width: "100%",
                    border: "1px solid #ccc",
                    marginTop: "10px",
                  }}
                />
                <p
                  style={{ fontSize: "0.9em", color: "#666", marginTop: "5px" }}
                >
                  Haz clic para ver información detallada sobre el audio
                  modulado
                </p>
              </div>

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

<<<<<<< HEAD
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
=======
        <Modal show={showAudioModal} onClose={() => setShowAudioModal(false)}>
          <h2 className="text-xl font-bold mb-4">Señal de Audio Original</h2>
          <div className="flex flex-col gap-4">
            <div>
              <h3>Características de la Señal</h3>
              <p>
                Esta es la señal de audio analógica original que será procesada
                a través de todo el sistema de codificación y modulación.
              </p>
              <ul style={{ textAlign: "left", margin: "10px 0" }}>
                <li>
                  • <strong>Tipo:</strong> Señal analógica continua
                </li>
                <li>
                  • <strong>Dominio:</strong> Tiempo
                </li>
                <li>
                  • <strong>Amplitud:</strong> Variable según el contenido de
                  audio
                </li>
                <li>
                  • <strong>Frecuencia:</strong> Rango audible (20 Hz - 20 kHz)
                </li>
              </ul>
            </div>
            <div>
              <h3>Visualización de la Señal Original</h3>
              <MiniWaveform
                data={results?.audio_data || []}
                color="#8e44ad"
                type="line"
                width={500}
                height={200}
              />
            </div>
            <div>
              <p>
                <strong>Proceso siguiente:</strong> Esta señal será muestreada y
                cuantizada mediante codificación PCM.
              </p>
            </div>
          </div>
        </Modal>

        <Modal show={showBinaryModal} onClose={() => setShowBinaryModal(false)}>
          <h2 className="text-xl font-bold mb-4">
            Datos Binarios - Entrada a Polar
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <h3>Características de los Datos Binarios</h3>
              <p>
                Representación digital de la señal PCM convertida a secuencia
                binaria antes del mapeo polar.
              </p>
              <ul style={{ textAlign: "left", margin: "10px 0" }}>
                <li>
                  • <strong>Tipo:</strong> Secuencia de bits (0s y 1s)
                </li>
                <li>
                  • <strong>Origen:</strong> Cuantización PCM
                </li>
                <li>
                  • <strong>Valores:</strong> 0 y 1 lógicos
                </li>
                <li>
                  • <strong>Propósito:</strong> Preparación para mapeo polar
                </li>
              </ul>
            </div>
            <div>
              <h3>Visualización de Datos Binarios</h3>
              <MiniWaveform
                data={results?.binary_data || []}
                color="#e73caeff"
                type="step"
                width={500}
                height={200}
              />
            </div>
            <div>
              <p>
                <strong>Proceso siguiente:</strong> Los bits serán mapeados a
                niveles de voltaje en la codificación polar (+V para 1, -V para
                0).
              </p>
            </div>
          </div>
        </Modal>

        <Modal show={showPolarModal} onClose={() => setShowPolarModal(false)}>
          <h2 className="text-xl font-bold mb-4">
            Señal Polar - Salida de Mapeo
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <h3>Características de la Señal Polar</h3>
              <p>
                Codificación polar NRZ donde los bits binarios se mapean a
                niveles de voltaje simétricos.
              </p>
              <ul style={{ textAlign: "left", margin: "10px 0" }}>
                <li>
                  • <strong>Tipo:</strong> Codificación de línea bipolar
                </li>
                <li>
                  • <strong>Mapeo:</strong> Bit 1 → +V, Bit 0 → -V
                </li>
                <li>
                  • <strong>Ventaja:</strong> Componente DC nula
                </li>
                <li>
                  • <strong>Uso:</strong> Modulación PSK
                </li>
              </ul>
            </div>
            <div>
              <h3>Visualización de la Señal Polar</h3>
              <MiniWaveform
                data={results?.polar_data || []}
                color="#5ee73cff"
                type="step"
                width={500}
                height={200}
              />
            </div>
            <div>
              <p>
                <strong>Proceso siguiente:</strong> Esta señal modulará la fase
                de la portadora en el proceso PSK.
              </p>
            </div>
          </div>
        </Modal>

        <Modal show={showPCMModal} onClose={() => setShowPCMModal(false)}>
          <h2 className="text-xl font-bold mb-4">
            Codificación PCM (Pulse Code Modulation)
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <h3>Características de la Codificación PCM</h3>
              <p>
                Proceso de conversión analógico-digital mediante muestreo,
                cuantización y codificación.
              </p>
              <ul className="modal-list">
                <li>
                  • <strong>Muestreo:</strong> {sampleRate} Hz (Frecuencia de
                  Nyquist)
                </li>
                <li>
                  • <strong>Cuantización:</strong> {bitDepth} bits por muestra
                </li>
                <li>
                  • <strong>Rango dinámico:</strong> {Math.pow(2, bitDepth)}{" "}
                  niveles
                </li>
                <li>
                  • <strong>Tipo:</strong> Codificación digital uniforme
                </li>
              </ul>
            </div>
            <div>
              <h3>Señal Original (Analógica)</h3>
              <MiniWaveform
                data={results?.audio_data || []}
                color="#8e44ad"
                type="line"
                width={500}
                height={200}
              />
            </div>
            <div>
              <h3>Señal PCM (Digital)</h3>
              <MiniWaveform
                data={results?.pcmData || []}
                color="#3498db"
                type="line"
                width={500}
                height={200}
              />
            </div>
            <div>
              <p>
                <strong>Proceso siguiente:</strong> Las muestras PCM serán
                convertidas a datos binarios para la codificación polar.
              </p>
            </div>
          </div>
        </Modal>

        <Modal show={showPSKModal} onClose={() => setShowPSKModal(false)}>
          <h2 className="text-xl font-bold mb-4">
            Modulación PSK (Phase Shift Keying)
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <h3>Características de la Modulación PSK</h3>
              <p>
                Modulación digital donde la información se transmite mediante
                cambios de fase de la portadora.
              </p>
              <ul className="modal-list">
                <li>
                  • <strong>Tipo:</strong> BPSK (Binary Phase Shift Keying)
                </li>
                <li>
                  • <strong>Fases:</strong> 0° para bit 1, 180° para bit 0
                </li>
                <li>
                  • <strong>Ventaja:</strong> Resistente al ruido
                </li>
                <li>
                  • <strong>Aplicación:</strong> Transmisión digital
                </li>
              </ul>
            </div>
            <div>
              <h3>Señal Portadora (sin modular)</h3>
              <MiniWaveform
                data={results?.carrier || []}
                color="#d0e73cff"
                type="line"
                width={500}
                height={200}
              />
            </div>
            <div>
              <h3>Señal Moduladora (Polar)</h3>
              <MiniWaveform
                data={results?.polar_data || []}
                color="#5ee73cff"
                type="step"
                width={500}
                height={200}
              />
            </div>
            <div>
              <h3>Señal PSK Modulada (Resultado Final)</h3>
              <MiniWaveform
                data={results?.pskData || []}
                color="#e74c3c"
                type="line"
                width={500}
                height={200}
              />
            </div>
            <div>
              <p>
                <strong>Resultado:</strong> Señal lista para transmisión con
                información digital codificada en cambios de fase.
              </p>
            </div>
          </div>
        </Modal>

        <Modal
          show={showCarrierModal}
          onClose={() => setShowCarrierModal(false)}
        >
          <h2 className="text-xl font-bold mb-4">Señal Portadora (Carrier)</h2>
          <div className="flex flex-col gap-4">
            <div>
              <h3>Características de la Portadora</h3>
              <p>
                Señal sinusoidal de alta frecuencia que transporta la
                información modulada.
              </p>
              <ul className="modal-list">
                <li>
                  • <strong>Tipo:</strong> Onda sinusoidal pura
                </li>
                <li>
                  • <strong>Función:</strong> Transportar información modulada
                </li>
                <li>
                  • <strong>Estabilidad:</strong> Frecuencia y amplitud
                  constantes
                </li>
                <li>
                  • <strong>Propósito:</strong> Facilitar la transmisión a larga
                  distancia
                </li>
              </ul>
            </div>
            <div>
              <h3>Visualización de la Portadora</h3>
              <MiniWaveform
                data={results?.carrier || []}
                color="#d0e73cff"
                type="line"
                width={500}
                height={200}
              />
            </div>
            <div>
              <p>
                <strong>Uso en PSK:</strong> Su fase se modifica según los datos
                binarios para crear la señal PSK modulada.
              </p>
            </div>
          </div>
        </Modal>

        <Modal
          show={showModulatedAudioModal}
          onClose={() => setShowModulatedAudioModal(false)}
        >
          <h2 className="text-xl font-bold mb-4">
            Audio Modulado PSK - Resultado Final
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <h3>¿Qué es el Audio Modulado PSK?</h3>
              <p>
                Este es el resultado final del proceso completo de codificación
                PCM y modulación PSK. La señal original de audio ha sido
                transformada en una señal digital modulada lista para
                transmisión.
              </p>
            </div>

            <div>
              <h3>Características del Audio Resultante</h3>
              <ul className="modal-list">
                <li>
                  • <strong>Tipo:</strong> Señal PSK (Phase Shift Keying)
                  modulada
                </li>
                <li>
                  • <strong>Frecuencia portadora:</strong> 1000 Hz (1 kHz)
                </li>
                <li>
                  • <strong>Sample Rate:</strong> {sampleRate} Hz
                </li>
                <li>
                  • <strong>Bit Depth:</strong> {bitDepth} bits por muestra
                </li>
                <li>
                  • <strong>Modulación:</strong> BPSK (Binary Phase Shift
                  Keying)
                </li>
              </ul>
            </div>

            <div>
              <h3>¿Por qué suena diferente al audio original?</h3>
              <p>El audio modulado suena muy diferente al original porque:</p>
              <ul className="modal-list">
                <li>
                  • <strong>Portadora audible:</strong> La frecuencia de 1 kHz
                  es audible y domina el sonido
                </li>
                <li>
                  • <strong>Cambios de fase:</strong> Los datos originales se
                  representan como cambios de fase de 180°
                </li>
                <li>
                  • <strong>Información codificada:</strong> El contenido
                  original está "escondido" en los cambios de fase
                </li>
                <li>
                  • <strong>Propósito de transmisión:</strong> Está diseñado
                  para ser transmitido, no para escucharse directamente
                </li>
              </ul>
            </div>

            <div>
              <h3>Duración y Expansión Temporal</h3>
              <p>
                La duración del audio modulado es considerablemente mayor que el
                original debido a:
              </p>
              <ul className="modal-list">
                <li>
                  • <strong>Expansión por bits:</strong> Cada muestra PCM genera{" "}
                  {bitDepth} bits
                </li>
                <li>
                  • <strong>Muestras por bit:</strong> Cada bit se extiende a
                  ~200 muestras para robustez
                </li>
                <li>
                  • <strong>Robustez:</strong> Mayor duración por bit mejora la
                  detección de señal
                </li>
              </ul>
            </div>

            <div>
              <h3>Visualización de la Señal Modulada</h3>
              <MiniWaveform
                data={results?.pskData || []}
                color="#e74c3c"
                type="line"
                width={500}
                height={200}
              />
            </div>

            <div>
              <h3>Proceso de Demodulación</h3>
              <p>Para recuperar el audio original, el receptor debe:</p>
              <ul className="modal-list">
                <li>
                  • <strong>Detectar cambios de fase:</strong> Identificar
                  transiciones de 0° y 180°
                </li>
                <li>
                  • <strong>Decodificar bits:</strong> Convertir fases a datos
                  binarios
                </li>
                <li>
                  • <strong>Reconstruir PCM:</strong> Reagrupar bits en muestras
                  PCM
                </li>
                <li>
                  • <strong>Conversión D/A:</strong> Convertir muestras
                  digitales a señal analógica
                </li>
              </ul>
            </div>

            <div>
              <p>
                <strong>Aplicaciones:</strong> Esta técnica se usa en sistemas
                de comunicación digital como módems, comunicaciones satelitales,
                WiFi, y sistemas de transmisión de datos robustos.
              </p>
            </div>
>>>>>>> 20f4caf5 (feat: Mejorar el procesamiento de audio con visualización dinámica de forma de onda PSK y controles de reproducción de audio)
          </div>
        </Modal>
      </div>

<<<<<<< HEAD
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
=======
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Universidad:</h4>
            <p>UPTC</p>
          </div>
          <div className="footer-section">
            <h4>Carrera:</h4>
            <p>Ingeniería de Sistemas y Computación</p>
          </div>
          <div className="footer-section">
            <h4>Materia:</h4>
            <p>Transmisión de Datos</p>
          </div>
          <div className="footer-section">
            <h4>Integrantes:</h4>
            <div className="integrantes">
              <p>Camilo Colón</p>
              <p>Kevin Gómez</p>
              <p>Alixon Lopez&nbsp;</p>
              <p>Juliana Rincón</p>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
>>>>>>> 20f4caf5 (feat: Mejorar el procesamiento de audio con visualización dinámica de forma de onda PSK y controles de reproducción de audio)

export default AudioProcessor;