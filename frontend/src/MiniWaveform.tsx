import React, { useRef, useEffect } from "react";

interface MiniWaveformProps {
  data: number[];
  color?: string;
  type?: "line" | "step"; 
  width?: number;
  height?: number;
}

const MiniWaveform: React.FC<MiniWaveformProps> = ({
  data,
  color = "#333",
  type = "line",
  width = 120,
  height = 60,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    const stepX = canvas.width / data.length;
    const mid = canvas.height / 2;
    const maxAmp = Math.max(...data.map(Math.abs), 1);

    ctx.moveTo(0, mid);

    if (type === "step") {
        ctx.lineWidth = 3;
      for (let i = 0; i < data.length; i++) {
        const x = i * stepX;
        const y = mid - (data[i] * (mid - 5)) / maxAmp;

        ctx.lineTo(x, y);
        ctx.lineTo(x + stepX, y);
      }
    } else {
      for (let i = 0; i < data.length; i++) {
        const x = i * stepX;
        const y = mid - (data[i] * (mid - 5)) / maxAmp;
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }, [data, color, type]);

  return <canvas ref={canvasRef} width={width} height={height} />;
};

export default MiniWaveform;
