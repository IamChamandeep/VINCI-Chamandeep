export type AssetType = 'audio' | 'image' | 'video' | 'srt' | 'overlay';

export type VisualEffectType = 
  | 'none' 
  | 'film-grain' 
  | 'old-film' 
  | 'fire-embers' 
  | 'vhs-glitch' 
  | 'dust-scratches' 
  | 'vignette' 
  | 'crt-lines' 
  | 'sepia-70s' 
  | 'cinema-lines' 
  | 'light-leaks' 
  | 'frame-jitter' 
  | 'damaged-negative' 
  | 'technicolor' 
  | 'vertical-dust';

export interface EffectSlot {
  type: VisualEffectType;
  strength: number;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  url: string;
  duration?: number;
  file?: File;
}

export interface Subtitle {
  id: number;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
}

export interface SubtitleSettings {
  fontSize: number;
  fontColor: string;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  outlineColor: string;
  outlineWidth: number;
  position: 'bottom' | 'top' | 'middle';
  backgroundColor: string;
  backgroundOpacity: number;
  frameBorderColor: string;
  frameHeight: number; // percentage 0-1
  effectSlots: EffectSlot[];
  autoStretch?: boolean; // Toggle for auto-stretching images to fit duration
  zoomIntensity: number; // Control for Ken Burns effect strength
}

export interface RenderSettings {
  filename: string;
  fps: number;
  bitrate: number; // in bps
  format: 'webm' | 'mp4';
}

export interface ProjectState {
  audio: Asset | null;
  images: Asset[];
  backgroundVideos: Asset[];
  overlays: Asset[];
  subtitles: Subtitle[];
  subtitleSettings: SubtitleSettings;
  currentTime: number;
  isPlaying: boolean;
  isRendering: boolean;
}