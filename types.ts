export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  base64?: string;
  mimeType: string;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface AnalysisError {
  message: string;
  details?: string;
}
