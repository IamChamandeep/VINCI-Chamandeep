
import React, { useRef } from 'react';
import { ProjectState } from '../types';

interface TimelineProps {
  state: ProjectState;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  totalDuration: number;
}

const Timeline: React.FC<TimelineProps> = ({ state, onSeek, onTogglePlay, totalDuration }) => {
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || totalDuration === 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onSeek(percentage * totalDuration);
  };

  const progress = totalDuration > 0 ? (state.currentTime / totalDuration) * 100 : 0;

  return (
    <div className="liquid-glass border-t border-white/10 p-4 h-60 flex flex-col gap-4 overflow-hidden select-none z-10 relative">
      {/* HEADER WITH INTEGRATED CONTROLS */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] font-black tabular-nums text-white/90">{formatTime(state.currentTime)}</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10"></div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00A3FF]"></div>
              <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Audio</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#BF00FF]"></div>
              <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Visuals</span>
            </div>
          </div>
        </div>

        {/* COMPACT PLAYBACK CONTROLS */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-2xl">
          <button 
            onClick={() => onSeek(Math.max(0, state.currentTime - 5))}
            className="w-8 h-8 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all active:scale-90"
          >
            <i className="fas fa-backward-step text-[10px]"></i>
          </button>
          
          <button 
            onClick={onTogglePlay}
            disabled={state.isRendering}
            className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
          >
            <i className={`fas ${state.isPlaying ? 'fa-pause' : 'fa-play'} text-xs ${state.isPlaying ? '' : 'ml-0.5'}`}></i>
          </button>

          <button 
            onClick={() => onSeek(Math.min(totalDuration, state.currentTime + 5))}
            className="w-8 h-8 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all active:scale-90"
          >
            <i className="fas fa-forward-step text-[10px]"></i>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
            <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Captions</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10"></div>
          <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] font-black tabular-nums text-white/40">{formatTime(totalDuration)}</span>
          </div>
        </div>
      </div>

      <div 
        ref={timelineRef}
        className="relative flex-1 bg-black/40 rounded-2xl border border-white/5 cursor-pointer overflow-hidden shadow-inner group"
        onClick={handleTimelineClick}
      >
        {/* Playhead */}
        <div 
          className="absolute top-0 bottom-0 w-[2px] bg-white z-30 pointer-events-none transition-all duration-75"
          style={{ left: `${progress}%` }}
        >
          <div className="w-4 h-4 bg-white rounded-full -ml-[7px] -mt-0 shadow-[0_0_15px_rgba(255,255,255,0.8)] border-2 border-black"></div>
        </div>

        {/* Tracks */}
        <div className="flex flex-col h-full py-1">
          {/* Subtitles Track */}
          <div className="h-1/4 relative border-b border-white/[0.03]">
             {state.subtitles.map(sub => (
               <div 
                key={sub.id}
                className="absolute h-full bg-amber-400/10 border-l border-r border-amber-400/20"
                style={{ 
                  left: `${(sub.startTime / totalDuration) * 100}%`,
                  width: `${((sub.endTime - sub.startTime) / totalDuration) * 100}%`
                }}
               />
             ))}
          </div>
          
          {/* Audio Track */}
          <div className="h-1/4 relative border-b border-white/[0.03]">
            {state.audio && (
              <div className="absolute inset-y-1 left-0 right-0 bg-[#00A3FF]/10 border border-[#00A3FF]/20 rounded-lg flex items-center px-3 text-[8px] font-black text-[#00A3FF] uppercase tracking-tighter">
                <i className="fas fa-wave-square mr-2 opacity-50"></i> {state.audio.name}
              </div>
            )}
          </div>

          {/* Background Visuals Track */}
          <div className="h-1/4 relative border-b border-white/[0.03] flex">
            {state.images.length > 0 && state.images.map((img, i) => {
               const segmentDuration = totalDuration / state.images.length;
               return (
                <div 
                  key={img.id}
                  className="h-full border-r border-white/10 bg-[#BF00FF]/5 flex items-center justify-center overflow-hidden"
                  style={{ width: `${(segmentDuration / totalDuration) * 100}%` }}
                >
                  <img src={img.url} className="w-full h-full object-cover opacity-10" alt="" />
                </div>
               );
            })}
          </div>

          {/* Overlays Track */}
          <div className="h-1/4 relative">
             {state.overlays.map((ov, i) => (
                <div 
                  key={ov.id}
                  className="absolute h-full bg-emerald-400/5 border-l border-emerald-400/20 px-2 text-[7px] font-black flex items-center text-emerald-400/40 uppercase truncate"
                  style={{ left: `${(i * 10) % 80}%`, width: '10%' }}
                >
                  {ov.name}
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* FOOTER CREDITS */}
      <div className="mt-1 flex items-center justify-center border-t border-white/5 pt-3">
        <a 
          href="https://www.instagram.com/iamchamandeep/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-all hover:scale-105 active:scale-95 group"
        >
          <i className="fab fa-instagram text-sm text-[#BF00FF] group-hover:scale-125 transition-transform"></i>
          <span className="text-[7px] font-black uppercase tracking-[0.5em] text-white">
            CHAMANDEEP SINGH / VINCI ENGINE 2.5
          </span>
        </a>
      </div>
    </div>
  );
};

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default Timeline;
