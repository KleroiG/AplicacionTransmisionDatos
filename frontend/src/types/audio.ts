export interface AudioProcessingResponse {
  message: string;
  pcm_samples: number[];
  psk_waveform: number[];
  audio_url: string;
}

export interface ProcessingResults {
  pcmData: number[];
  pskData: number[];
  audioUrl: string;
}