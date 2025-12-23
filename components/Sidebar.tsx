import React, { useState } from 'react';
import { Asset, AssetType } from '../types';

interface SidebarProps {
  assets: {
    audio: Asset | null;
    images: Asset[];
    videos: Asset[];
    overlays: Asset[];
  };
  onUpload: (type: AssetType, file: File) => void;
  onRemove: (type: AssetType, id: string) => void;
  autoStretch: boolean;
  onToggleStretch: (val: boolean) => void;
  onRender: () => void;
  isRendering: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ assets, onUpload, onRemove, autoStretch, onToggleStretch, onRender, isRendering }) => {
  const handleFileChange = (type: AssetType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(type, file);
  };

  return (
    <div className="w-80 liquid-glass flex flex-col z-20">
      <div className="p-8 border-b border-white/20 bg-white/[0.02]">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-3">
            <span className="bg-gradient-to-tr from-[#00A3FF] to-[#BF00FF] bg-clip-text text-transparent">VINCI</span>
            <span className="font-light text-white">AUTO</span>
          </h1>
          <p className="text-[9px] uppercase tracking-[0.4em] font-black text-white/80 mt-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#00A3FF]"></span>
            Made by Chamandeep
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-7 custom-scrollbar">
        {/* Audio Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Audio Feed</h3>
            <label className="cursor-pointer w-8 h-8 rounded-full liquid-button flex items-center justify-center hover:border-white/50 border-white/20 bg-white/10">
              <i className="fas fa-plus text-[11px] text-[#00A3FF]"></i>
              <input type="file" className="hidden" accept="audio/*" onChange={handleFileChange('audio')} />
            </label>
          </div>
          <div className="space-y-3">
            {assets.audio ? (
              <div className="liquid-button bg-white/[0.12] p-4 rounded-2xl flex items-center justify-between group animate-in fade-in slide-in-from-left-4 border-white/30">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-[#00A3FF]/30 flex items-center justify-center text-[#00A3FF]">
                    <i className="fas fa-wave-square text-lg shadow-sm"></i>
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-xs font-black text-white">{assets.audio.name}</span>
                    <span className="text-[9px] text-white/70 font-black uppercase tracking-wider">Loaded Track</span>
                  </div>
                </div>
                <button onClick={() => onRemove('audio', assets.audio!.id)} className="w-8 h-8 rounded-lg hover:bg-red-500/30 text-white/60 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                  <i className="fas fa-trash-alt text-xs"></i>
                </button>
              </div>
            ) : (
              <div className="border border-dashed border-white/20 rounded-2xl py-8 flex flex-col items-center gap-3 text-white/60 transition-all hover:border-white/40 group hover:bg-white/[0.05]">
                <i className="fas fa-music text-xl opacity-60 group-hover:scale-110 transition-transform"></i>
                <span className="text-[10px] uppercase font-black tracking-widest">Connect Audio</span>
              </div>
            )}
          </div>
        </section>

        {/* Visuals Section */}
        <section className="space-y-4">
           <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Canvas Grid</h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onToggleStretch(!autoStretch)}
                className={`text-[9px] px-3 py-1.5 rounded-full font-black transition-all border ${autoStretch ? 'bg-[#00A3FF]/30 border-[#00A3FF] text-white shadow-[0_0_15px_rgba(0,163,255,0.4)]' : 'bg-white/10 border-white/30 text-white/80 hover:text-white'}`}
              >
                {autoStretch ? 'AUTO-FILL' : 'STATIC'}
              </button>
              <label className="cursor-pointer w-8 h-8 rounded-full liquid-button flex items-center justify-center hover:border-white/50 border-white/20 bg-white/10">
                <i className="fas fa-plus text-[11px] text-[#BF00FF]"></i>
                <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach(f => onUpload('image', f));
                }} />
              </label>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {assets.images.map(img => (
              <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden group liquid-button border-white/20">
                <img src={img.url} className="w-full h-full object-cover transition-all duration-700 scale-110 group-hover:scale-100" alt="" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <button onClick={() => onRemove('image', img.id)} className="w-10 h-10 rounded-full liquid-button bg-red-600 text-white border-red-500 shadow-lg shadow-red-900/50">
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Overlays */}
        <section className="space-y-4">
           <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Layers</h3>
            <label className="cursor-pointer w-8 h-8 rounded-full liquid-button flex items-center justify-center hover:border-white/50 border-white/20 bg-white/10">
              <i className="fas fa-plus text-[11px] text-emerald-400"></i>
              <input type="file" className="hidden" accept="image/png" onChange={handleFileChange('overlay')} />
            </label>
          </div>
          <div className="space-y-2">
            {assets.overlays.map(ov => (
              <div key={ov.id} className="liquid-button bg-white/[0.12] px-4 py-3 rounded-2xl flex items-center justify-between text-[10px] font-black text-white group border-white/30">
                <div className="flex items-center gap-3">
                  <i className="fas fa-layer-group text-emerald-400"></i>
                  <span className="truncate">{ov.name}</span>
                </div>
                <button onClick={() => onRemove('overlay', ov.id)} className="text-white/60 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Subtitles */}
        <section className="space-y-4">
           <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Scripting</h3>
            <label className="cursor-pointer w-8 h-8 rounded-full liquid-button flex items-center justify-center hover:border-white/50 border-white/20 bg-white/10">
              <i className="fas fa-closed-captioning text-[11px] text-amber-400"></i>
              <input type="file" className="hidden" accept=".srt" onChange={handleFileChange('srt')} />
            </label>
          </div>
        </section>
      </div>

      <div className="p-8 bg-white/[0.05] border-t border-white/20 backdrop-blur-2xl">
        <button 
            onClick={onRender}
            className={`w-full py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all liquid-button ${
              isRendering 
                ? 'bg-amber-600 text-white border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.5)]' 
                : 'btn-neon-blue bg-gradient-to-tr from-[#00A3FF]/50 to-[#BF00FF]/50 text-white shadow-[0_15px_50px_-10px_rgba(0,163,255,0.6)] border-white/40'
            }`}
            disabled={!assets.audio || isRendering}
        >
          {isRendering ? (
            <><div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></div> GENERATING MASTER</>
          ) : (
            <><i className="fas fa-rocket text-[12px] animate-bounce"></i> LAUNCH PRODUCTION</>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
