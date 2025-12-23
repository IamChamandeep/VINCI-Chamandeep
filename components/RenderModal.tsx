import React, { useState, useEffect } from 'react';
import { RenderSettings } from '../types';

interface RenderModalProps {
  onConfirm: (settings: RenderSettings) => void;
  onClose: () => void;
}

const RenderModal: React.FC<RenderModalProps> = ({ onConfirm, onClose }) => {
  const [filename, setFilename] = useState('Production_Master');
  const [fps, setFps] = useState(30);
  const [quality, setQuality] = useState('high');
  const [format, setFormat] = useState<'webm' | 'mp4'>('mp4');
  const [mp4Supported, setMp4Supported] = useState(false);

  useEffect(() => {
    // Check for MP4 support but default to trying it anyway
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
      const supported = MediaRecorder.isTypeSupported('video/mp4') || MediaRecorder.isTypeSupported('video/mp4;codecs=avc1');
      setMp4Supported(supported);
      // Force MP4 as default
      setFormat('mp4');
    }
  }, []);

  const getBitrate = () => {
    switch (quality) {
      case 'ultra': return 25000000;
      case 'high': return 12000000;
      case 'medium': return 6000000;
      default: return 3000000;
    }
  };

  const handleStart = () => {
    onConfirm({
      filename,
      fps,
      bitrate: getBitrate(),
      format: format
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/40">
      <div 
        className="absolute inset-0 cursor-zoom-out"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-xl liquid-glass rounded-[40px] shadow-[0_60px_150px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 fade-in duration-500">
        <div className="p-10 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl liquid-button flex items-center justify-center text-[#00A3FF]">
                <i className="fas fa-satellite-dish text-xl"></i>
              </span>
              Export Hub
            </h2>
            <p className="text-[10px] text-white/30 mt-2 uppercase tracking-[0.4em] font-black">Professional Media Encoder</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full liquid-button text-white/20 hover:text-white transition-colors">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        <div className="p-10 space-y-10">
          {/* Filename */}
          <div className="space-y-4">
            <label className="text-[10px] text-white/20 uppercase font-black tracking-[0.3em] px-2">Production Title</label>
            <div className="liquid-button bg-black/40 rounded-3xl overflow-hidden focus-within:border-[#00A3FF]/40 transition-all flex items-center">
              <input 
                type="text" 
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="flex-1 bg-transparent px-8 py-5 text-sm outline-none font-black tracking-tight"
              />
              <div className="px-8 py-5 text-[10px] font-black text-[#00A3FF] uppercase tracking-widest bg-white/[0.03] border-l border-white/5">
                .MP4
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10">
            {/* Format & FPS */}
            <div className="space-y-8">
               <div className="space-y-4">
                <label className="text-[10px] text-white/20 uppercase font-black tracking-[0.3em] px-2">Output Container</label>
                <div className="flex p-1.5 liquid-button rounded-[24px]">
                  <button 
                    disabled
                    className="flex-1 py-3.5 rounded-[18px] text-[10px] font-black tracking-[0.1em] transition-all bg-white text-black shadow-xl"
                  >
                    MP4 (H.264)
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] text-white/20 uppercase font-black tracking-[0.3em] px-2">Framerate</label>
                <div className="flex gap-3 liquid-button p-1.5 rounded-[24px]">
                  {[24, 30, 60].map(v => (
                    <button 
                      key={v}
                      onClick={() => setFps(v)}
                      className={`flex-1 py-3.5 rounded-[18px] text-[10px] font-black transition-all ${fps === v ? 'bg-[#00A3FF]/20 text-[#00A3FF] border border-[#00A3FF]/30' : 'text-white/30'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quality */}
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] text-white/20 uppercase font-black tracking-[0.3em] px-2">Mastering Depth</label>
                <div className="space-y-3">
                  {[
                    { id: 'ultra', label: 'ULTRA HD', bit: '25 Mbps' },
                    { id: 'high', label: 'STUDIO PRO', bit: '12 Mbps' },
                    { id: 'medium', label: 'SOCIAL OK', bit: '6 Mbps' }
                  ].map(q => (
                    <button 
                      key={q.id}
                      onClick={() => setQuality(q.id)}
                      className={`w-full flex items-center justify-between px-6 py-4 rounded-[22px] liquid-button text-[9px] font-black uppercase tracking-[0.2em] transition-all ${quality === q.id ? 'btn-neon-blue text-[#00A3FF]' : 'text-white/20 border-white/5'}`}
                    >
                      <span>{q.label}</span>
                      <span className="opacity-40">{q.bit}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#00A3FF]/5 border border-[#00A3FF]/10 rounded-3xl p-6 flex gap-6 items-center">
             <div className="w-12 h-12 rounded-2xl liquid-button flex items-center justify-center text-[#00A3FF] shrink-0">
                <i className="fas fa-music text-lg"></i>
             </div>
             <p className="text-[10px] text-white/40 leading-relaxed font-bold uppercase tracking-wider">
               Synchronized <span className="text-white/80">Audio Mastering</span> enabled. MP4 format ensures high compatibility for YouTube & Reels.
             </p>
          </div>
        </div>

        <div className="p-10 bg-white/[0.01] border-t border-white/5 flex gap-6">
          <button 
            onClick={onClose}
            className="flex-1 py-6 rounded-[28px] liquid-button text-[11px] font-black tracking-[0.3em] uppercase text-white/40"
          >
            Cancel
          </button>
          <button 
            onClick={handleStart}
            className="flex-[2] py-6 rounded-[28px] liquid-button btn-neon-blue text-white font-black text-xs tracking-[0.4em] uppercase shadow-[0_20px_60px_rgba(0,163,255,0.3)] group"
          >
            <span>Compile Production</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenderModal;