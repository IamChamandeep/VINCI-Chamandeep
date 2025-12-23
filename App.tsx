
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
  const [renderProgress, setRenderProgress] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  const audioObjRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const localGainRef = useRef<GainNode | null>(null);
  const renderDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const isStopRequested = useRef(false);

  useEffect(() => {
    const audio = audioObjRef.current;
    if (!audio) return;

    const handlePlayState = async () => {
      if (state.isRendering) {
          if (audio.paused) audio.play().catch(e => console.error("Audio resume failed", e));
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

  const handleReset = () => {
    if (audioObjRef.current) {
      audioObjRef.current.pause();
      audioObjRef.current.src = '';
      audioObjRef.current = null;
    }
    setTotalDuration(0);
    setState({
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
  };

  const startRendering = async (settings: RenderSettings) => {
    if (!state.audio || !audioObjRef.current) return;
    
    isStopRequested.current = false;
    setRenderProgress(0);
    setIsRenderModalOpen(false);
    
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    setState(prev => ({ ...prev, isRendering: true, isPlaying: false, currentTime: 0 }));

    if (audioCtxRef.current?.state === 'suspended') {
        await audioCtxRef.current.resume();
    }

    if (localGainRef.current) {
        localGainRef.current.gain.setTargetAtTime(0, audioCtxRef.current!.currentTime, 0.01);
    }

    const canvasStream = canvas.captureStream(settings.fps);
    const audioStream = renderDestRef.current ? renderDestRef.current.stream : new MediaStream();

    const tracks = [
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
    ];
    
    const combinedStream = new MediaStream(tracks);
    const recorder = new MediaRecorder(combinedStream, {
      mimeType: MediaRecorder.isTypeSupported('video/mp4;codecs=avc1') ? 'video/mp4;codecs=avc1' : 'video/webm;codecs=vp9',
      videoBitsPerSecond: settings.bitrate
    });

    chunksRef.current = [];
    recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      if (chunksRef.current.length === 0) {
          alert("Production Error: No data captured.");
          setState(prev => ({ ...prev, isRendering: false }));
          return;
      }
      
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      
      // Filename construction
      const extension = recorder.mimeType.includes('mp4') ? 'mp4' : 'webm';
      a.download = `${settings.filename}.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      if (localGainRef.current) {
          localGainRef.current.gain.setTargetAtTime(1, audioCtxRef.current!.currentTime, 0.1);
      }
      setState(prev => ({ ...prev, isRendering: false }));
    };

    await new Promise(r => setTimeout(r, 1000));
    recorder.start(1000); 

    const runProduction = async () => {
      const audio = audioObjRef.current!;
      audio.currentTime = 0;
      try { await audio.play(); } catch (e) { console.error(e); }
      const startTime = performance.now();
      const productionInterval = setInterval(() => {
        if (isStopRequested.current) {
            clearInterval(productionInterval);
            audio.pause();
            recorder.stop();
            return;
        }
        const elapsed = (performance.now() - startTime) / 1000;
        const currentPos = (audio.currentTime > 0) ? audio.currentTime : elapsed;
        if (currentPos >= totalDuration || audio.ended) {
            clearInterval(productionInterval);
            audio.pause();
            setTimeout(() => recorder.stop(), 2000); 
            return;
        }
        setState(prev => ({ ...prev, currentTime: currentPos }));
        setRenderProgress(Math.min((currentPos / totalDuration) * 100, 99.9));
      }, 1000 / (settings.fps * 1.2));
    };

    runProduction();
  };

  const cancelRendering = () => {
    isStopRequested.current = true;
    if (audioObjRef.current) audioObjRef.current.pause();
    setState(prev => ({ ...prev, isRendering: false, isPlaying: false }));
  };

  return (
    <div className="flex h-screen w-full bg-[#020205] text-zinc-100 selection:bg-blue-500/30 font-sans overflow-hidden">
      <Sidebar 
        assets={{ audio: state.audio, images: state.images, videos: state.backgroundVideos, overlays: state.overlays }} 
        onUpload={handleUpload}
        onRemove={handleRemove}
        onReset={handleReset}
        autoStretch={state.subtitleSettings.autoStretch || false}
        onToggleStretch={(val) => setState(p => ({ ...p, subtitleSettings: { ...p.subtitleSettings, autoStretch: val } }))}
        onRender={() => setIsRenderModalOpen(true)}
        isRendering={state.isRendering}
      />
      
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        {/* PREVIEW CONTAINER - Uses min-h-0 to be strictly sized by flex and prevent hiding behind timeline */}
        <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
            <PreviewArea state={state} totalDuration={totalDuration} />
            
            {state.isRendering && (
              <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-12 animate-in fade-in duration-500">
                <div className="w-full max-w-xl space-y-12">
                  <div className="space-y-4 text-center">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-[#00A3FF]/10 border border-[#00A3FF]/20 rounded-full">
                        <div className="w-2 h-2 bg-[#00A3FF] rounded-full animate-pulse shadow-[0_0_12px_rgba(0,163,255,1)]"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00A3FF]">Background Mastering Active</span>
                    </div>
                    <h3 className="text-4xl font-black tracking-tight text-white uppercase italic">Turbo Render Active</h3>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] opacity-60 italic">Processing Master Files...</p>
                  </div>

                  <div className="relative pt-2">
                    <div className="flex items-center justify-between mb-4 px-1 text-white">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#BF00FF]">Production Buffer</span>
                        <span className="text-4xl font-black tabular-nums">{Math.floor(renderProgress)}%</span>
                      </div>
                    </div>
                    <div className="h-5 bg-zinc-900 rounded-full overflow-hidden border border-white/5 p-1">
                      <div className="h-full bg-gradient-to-r from-[#00A3FF] via-[#BF00FF] to-[#00A3FF] bg-[length:200%_100%] animate-[gradient_2s_linear_infinite] rounded-full transition-all duration-300" style={{ width: `${renderProgress}%` }} />
                    </div>
                  </div>

                  <button onClick={cancelRendering} className="mx-auto px-10 py-5 bg-zinc-900 hover:bg-red-600/10 hover:text-red-500 border border-white/5 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-4">
                    <i className="fas fa-power-off opacity-40"></i> Kill Thread
                  </button>
                </div>
              </div>
            )}

            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-4 py-1.5 rounded-full border border-white/20 text-[10px] uppercase tracking-widest font-bold text-white z-10 flex items-center gap-3">
                {state.isRendering && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>}
                {state.isRendering ? '🟠 TURBO ENGINE ENGAGED' : (state.isPlaying ? '🔴 LIVE STREAM' : '⏸ IDLE')}
            </div>

            {/* COLLAPSE TOGGLE BUTTON */}
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`absolute top-1/2 right-0 -translate-y-1/2 z-40 w-10 h-24 liquid-glass border border-white/10 border-r-0 rounded-l-3xl flex items-center justify-center text-white/40 hover:text-white transition-all shadow-xl group ${!isSettingsOpen ? 'translate-x-0' : 'translate-x-[2px]'}`}
              title={isSettingsOpen ? "Collapse Settings" : "Expand Settings"}
            >
              <i className={`fas fa-chevron-${isSettingsOpen ? 'right' : 'left'} text-sm group-hover:scale-125 transition-transform`}></i>
            </button>
        </div>

        {/* TIMELINE - Strictly positioned below the preview */}
        <div className="shrink-0 h-60">
          <Timeline 
            state={state} 
            totalDuration={totalDuration} 
            onSeek={t => !state.isRendering && setState(s => ({...s, currentTime: t}))} 
            onTogglePlay={() => setState(p => ({...p, isPlaying: !p.isPlaying}))}
          />
        </div>
      </main>

      {/* COLLAPSIBLE SIDEBAR */}
      <div className={`transition-all duration-500 ease-in-out h-full overflow-hidden ${isSettingsOpen ? 'w-[400px] opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
        <div className="w-[400px] h-full">
          <SettingsPanel settings={state.subtitleSettings} onChange={s => setState(p => ({ ...p, subtitleSettings: s }))} />
        </div>
      </div>

      {isRenderModalOpen && (
        <RenderModal onConfirm={startRendering} onClose={() => setIsRenderModalOpen(false)} />
      )}
    </div>
  );
};

export default App;
