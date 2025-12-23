import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import PreviewArea from './components/PreviewArea';
import SettingsPanel from './components/SettingsPanel';
import Timeline from './components/Timeline';
import RenderModal from './components/RenderModal';
import { ProjectState, Asset, AssetType, SubtitleSettings, RenderSettings } from './types';
import { parseSRT } from './utils/srtParser';

const INITIAL_DEFAULTS: SubtitleSettings = {
  fontSize: 29,
  fontColor: '#ffffff',
  fontFamily: 'DM Sans',
  fontWeight: 'bold',
  fontStyle: 'italic',
  outlineColor: '#000000',
  outlineWidth: 2,
  position: 'bottom',
  backgroundColor: '#000000',
  backgroundOpacity: 0.7,
  frameBorderColor: '#FFD700', 
  frameHeight: 0.79,
  autoStretch: true,
  zoomIntensity: 1.0,
  effectSlots: [
    { type: 'film-grain', strength: 0.4 },
    { type: 'none', strength: 0.5 },
    { type: 'none', strength: 0.5 }
  ]
};

const App: React.FC = () => {
  const [state, setState] = useState<ProjectState>({
    audio: null,
    images: [],
    backgroundVideos: [],
    overlays: [],
    subtitles: [],
    subtitleSettings: INITIAL_DEFAULTS,
    currentTime: 0,
    isPlaying: false,
    isRendering: false
  });

  const [totalDuration, setTotalDuration] = useState(0);
  const [isRenderModalOpen, setIsRenderModalOpen] = useState(false);
  const [renderSettings, setRenderSettings] = useState<RenderSettings | null>(null);
  const [renderProgress, setRenderProgress] = useState(0);

  const audioObjRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const localGainRef = useRef<GainNode | null>(null);
  const renderDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // For Deterministic Background Rendering
  const isStopRequested = useRef(false);

  useEffect(() => {
    const audio = audioObjRef.current;
    if (!audio) return;

    const handlePlayState = async () => {
      if (state.isRendering) {
          audio.pause();
          return;
      }

      if (state.isPlaying) {
        if (audioCtxRef.current?.state === 'suspended') {
          await audioCtxRef.current.resume();
        }
        if (localGainRef.current) {
          localGainRef.current.gain.setTargetAtTime(1, audioCtxRef.current!.currentTime, 0.05);
        }
        audio.play().catch(console.error);
      } else {
        audio.pause();
      }
    };

    handlePlayState();
  }, [state.isPlaying, state.isRendering]);

  useEffect(() => {
    const audio = audioObjRef.current;
    if (!audio || state.isRendering) return;

    if (Math.abs(audio.currentTime - state.currentTime) > 0.3) {
      audio.currentTime = state.currentTime;
    }
  }, [state.currentTime, state.isRendering]);

  useEffect(() => {
    const audio = audioObjRef.current;
    if (!audio || state.isRendering) return;

    const handleTimeUpdate = () => {
      if (state.isPlaying) {
        setState(prev => ({ ...prev, currentTime: audio.currentTime }));
      }
    };

    const handleEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false, currentTime: totalDuration }));
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [state.isPlaying, state.isRendering, totalDuration]);

  const setupAudioGraph = (audioEl: HTMLAudioElement) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (sourceNodeRef.current) sourceNodeRef.current.disconnect();

    const source = ctx.createMediaElementSource(audioEl);
    const localGain = ctx.createGain();
    const renderDest = ctx.createMediaStreamDestination();

    source.connect(localGain);
    localGain.connect(ctx.destination);
    source.connect(renderDest);

    sourceNodeRef.current = source;
    localGainRef.current = localGain;
    renderDestRef.current = renderDest;
  };

  const handleUpload = async (type: AssetType, file: File) => {
    const url = URL.createObjectURL(file);
    const id = Math.random().toString(36).substr(2, 9);
    
    if (type === 'audio') {
      if (audioObjRef.current) audioObjRef.current.pause();
      const audio = new Audio(url);
      audio.crossOrigin = "anonymous";
      audioObjRef.current = audio;
      audio.onloadedmetadata = () => {
        setTotalDuration(audio.duration);
        setupAudioGraph(audio);
        setState(prev => ({ ...prev, currentTime: 0, isPlaying: false, audio: { id, name: file.name, type, url, duration: audio.duration } }));
      };
    } else if (type === 'srt') {
      const text = await file.text();
      setState(prev => ({ ...prev, subtitles: parseSRT(text) }));
    } else if (type === 'image') {
      setState(prev => ({ ...prev, images: [...prev.images, { id, name: file.name, type, url }] }));
    } else if (type === 'overlay') {
      setState(prev => ({ ...prev, overlays: [...prev.overlays, { id, name: file.name, type, url }] }));
    }
  };

  const handleRemove = (type: AssetType, id: string) => {
    setState(prev => {
      if (type === 'audio') {
        if (audioObjRef.current) { audioObjRef.current.pause(); audioObjRef.current.src = ''; }
        return { ...prev, audio: null, currentTime: 0, isPlaying: false };
      }
      if (type === 'image') return { ...prev, images: prev.images.filter(a => a.id !== id) };
      if (type === 'overlay') return { ...prev, overlays: prev.overlays.filter(a => a.id !== id) };
      return prev;
    });
  };

  const startRendering = async (settings: RenderSettings) => {
    if (!state.audio || !audioObjRef.current) return;
    
    isStopRequested.current = false;
    setRenderSettings(settings);
    setIsRenderModalOpen(false);
    
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    setState(prev => ({ ...prev, isRendering: true, isPlaying: false, currentTime: 0 }));
    setRenderProgress(0);

    const stream = canvas.captureStream(0); 
    const recorder = new MediaRecorder(stream, {
      mimeType: settings.format === 'mp4' ? 'video/x-matroska;codecs=avc1' : 'video/webm;codecs=vp9',
      videoBitsPerSecond: settings.bitrate
    });

    chunksRef.current = [];
    recorder.ondataavailable = e => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${settings.filename}.${settings.format}`;
      a.click();
      setState(prev => ({ ...prev, isRendering: false }));
    };

    recorder.start();

    const fps = settings.fps;
    const frameTime = 1 / fps;
    let renderTime = 0;

    /**
     * TIGHT RENDERING LOOP
     * We use a while loop with a tiny timeout instead of requestAnimationFrame.
     * Browsers throttle requestAnimationFrame heavily in background tabs, 
     * but async loops with minimal yield stay active much longer.
     */
    const runExport = async () => {
      while (renderTime <= totalDuration && !isStopRequested.current) {
        // Step 1: Update current time state
        setState(prev => ({ ...prev, currentTime: renderTime }));
        setRenderProgress((renderTime / totalDuration) * 100);

        // Step 2: Yield control to let the browser draw the frame
        // We use a small delay which is more resilient to background throttling than RAF
        await new Promise(r => setTimeout(r, 4)); 

        // Step 3: Advance time
        renderTime += frameTime;
      }
      
      recorder.stop();
    };

    runExport();
  };

  const cancelRendering = () => {
    isStopRequested.current = true;
    setState(prev => ({ ...prev, isRendering: false, isPlaying: false }));
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 selection:bg-blue-500/30 font-sans">
      <Sidebar 
        assets={{ audio: state.audio, images: state.images, videos: state.backgroundVideos, overlays: state.overlays }} 
        onUpload={handleUpload}
        onRemove={handleRemove}
        autoStretch={state.subtitleSettings.autoStretch || false}
        onToggleStretch={(val) => setState(p => ({ ...p, subtitleSettings: { ...p.subtitleSettings, autoStretch: val } }))}
        onRender={() => setIsRenderModalOpen(true)}
        isRendering={state.isRendering}
      />
      
      <main className="flex-1 flex flex-col min-w-0 relative">
        <div className="flex-1 relative overflow-hidden flex flex-col">
            <PreviewArea state={state} totalDuration={totalDuration} onTogglePlay={() => setState(p => ({...p, isPlaying: !p.isPlaying}))} />
            
            {state.isRendering && (
              <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-12 animate-in fade-in duration-500">
                <div className="w-full max-w-xl space-y-10">
                  <div className="space-y-4 text-center">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Deterministic Engine v2</span>
                    </div>
                    <h3 className="text-4xl font-black tracking-tight text-white">Advanced Mastering</h3>
                    <p className="text-zinc-500 text-sm font-medium">Bypassing browser throttling... Using full GPU power.</p>
                  </div>

                  <div className="relative pt-2">
                    <div className="flex items-center justify-between mb-3 px-1 text-white">
                      <span className="text-xs font-bold uppercase tracking-widest">Mastering Progress</span>
                      <span className="text-4xl font-black tabular-nums">{Math.floor(renderProgress)}%</span>
                    </div>
                    <div className="h-4 bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-700/50 p-1">
                      <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.4)]" style={{ width: `${renderProgress}%` }} />
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-8">
                    <button onClick={cancelRendering} className="px-10 py-4 bg-zinc-900 hover:bg-red-600/10 hover:text-red-500 hover:border-red-500/30 border border-zinc-800 rounded-2xl text-xs font-black transition-all active:scale-95 flex items-center gap-3">
                      <i className="fas fa-ban opacity-50"></i> STOP PRODUCTION
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-4 py-1.5 rounded-full border border-white/20 text-[10px] uppercase tracking-widest font-bold text-white z-10">
                {state.isRendering ? '🟠 PROCESSING ASSETS' : (state.isPlaying ? '🔴 LIVE STREAM' : '⏸ IDLE')}
            </div>
        </div>
        <Timeline state={state} totalDuration={totalDuration} onSeek={t => !state.isRendering && setState(s => ({...s, currentTime: t}))} />
      </main>

      <SettingsPanel settings={state.subtitleSettings} onChange={s => setState(p => ({ ...p, subtitleSettings: s }))} />

      {isRenderModalOpen && (
        <RenderModal onConfirm={startRendering} onClose={() => setIsRenderModalOpen(false)} />
      )}
    </div>
  );
};

export default App;