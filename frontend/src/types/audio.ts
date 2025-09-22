export interface AudioProcessingResponse {
  message: string;
  pcm_samples: number[];
  psk_waveform: number[];
  audio_url: string;
}

export interface ProcessingResults {
  audio_data: number[];
  pcmData: number[];
  pskData: number[];
  binary_data: number[];
  polar_data: number[];
  carrier: number[];
  audioUrl: string;
}
