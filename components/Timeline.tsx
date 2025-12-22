import React, { useRef, useEffect } from 'react';
import { ProjectState } from '../types';

interface TimelineProps {
  state: ProjectState;
  onSeek: (time: number) => void;
  totalDuration: number;
}

const Timeline: React.FC<TimelineProps> = ({ state, onSeek, totalDuration }) => {
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
    <div className="liquid-glass border-t border-white/10 p-6 h-64 flex flex-col gap-5 overflow-hidden select-none z-10 relative">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
        <span className="bg-white/10 px-3 py-1 rounded-full text-white">{formatTime(state.currentTime)}</span>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00A3FF] shadow-[0_0_8px_#00A3FF]"></div>
            <span className="text-white/80">Audio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#BF00FF] shadow-[0_0_8px_#BF00FF]"></div>
            <span className="text-white/80">Visuals</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]"></div>
            <span className="text-white/80">Captions</span>
          </div>
        </div>
        <span className="bg-white/10 px-3 py-1 rounded-full text-white">{formatTime(totalDuration)}</span>
      </div>

      <div 
        ref={timelineRef}
        className="relative flex-1 bg-black/60 rounded-3xl border border-white/10 cursor-pointer overflow-hidden shadow-inner"
        onClick={handleTimelineClick}
      >
        {/* Playhead */}
        <div 
          className="absolute top-0 bottom-0 w-[3px] bg-white z-30 pointer-events-none shadow-[0_0_15px_rgba(255,255,255,1)]"
          style={{ left: `${progress}%` }}
        >
          <div className="w-5 h-5 bg-white rounded-full -ml-[9px] -mt-0.5 shadow-[0_0_20px_rgba(255,255,255,0.6)] border-4 border-black"></div>
        </div>

        {/* Tracks */}
        <div className="flex flex-col h-full py-2">
          {/* Subtitles Track */}
          <div className="h-1/4 relative border-b border-white/[0.05]">
             {state.subtitles.map(sub => (
               <div 
                key={sub.id}
                className="absolute h-full bg-amber-400/20 border-l border-r border-amber-400/40"
                style={{ 
                  left: `${(sub.startTime / totalDuration) * 100}%`,
                  width: `${((sub.endTime - sub.startTime) / totalDuration) * 100}%`
                }}
               />
             ))}
          </div>
          
          {/* Audio Track */}
          <div className="h-1/4 relative border-b border-white/[0.05]">
            {state.audio && (
              <div className="absolute inset-y-1 left-0 right-0 bg-[#00A3FF]/20 border border-[#00A3FF]/40 rounded-lg flex items-center px-4 text-[9px] font-black text-[#00A3FF] uppercase tracking-wider">
                <i className="fas fa-music mr-2"></i> {state.audio.name}
              </div>
            )}
          </div>

          {/* Background Visuals Track */}
          <div className="h-1/4 relative border-b border-white/[0.05] flex">
            {state.images.length > 0 && state.images.map((img, i) => {
               const segmentDuration = totalDuration / state.images.length;
               return (
                <div 
                  key={img.id}
                  className="h-full border-r border-white/10 bg-[#BF00FF]/10 flex items-center justify-center overflow-hidden"
                  style={{ width: `${(segmentDuration / totalDuration) * 100}%` }}
                >
                  <img src={img.url} className="w-full h-full object-cover opacity-20" alt="" />
                </div>
               );
            })}
          </div>

          {/* Overlays Track */}
          <div className="h-1/4 relative">
             {state.overlays.map((ov, i) => (
                <div 
                  key={ov.id}
                  className="absolute h-full bg-emerald-400/20 border-l border-emerald-400/40 px-2 text-[8px] font-black flex items-center text-emerald-400 uppercase"
                  style={{ left: `${(i * 5) % 80}%`, width: '15%' }}
                >
                  {ov.name}
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* FOOTER CREDITS */}
      <div className="mt-2 flex items-center justify-center border-t border-white/10 pt-4">
        <a 
          href="https://www.instagram.com/iamchamandeep/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group flex items-center gap-3 px-6 py-2 rounded-full hover:bg-white/10 transition-all duration-300"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 group-hover:text-[#BF00FF] transition-colors">
            Made and designed by Chamandeep Singh
          </span>
          <div className="w-8 h-8 rounded-full liquid-glass flex items-center justify-center group-hover:scale-110 transition-transform border-white/20">
            <i className="fab fa-instagram text-[12px] text-white/60 group-hover:text-white"></i>
          </div>
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
