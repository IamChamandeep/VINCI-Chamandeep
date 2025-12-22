import React, { useState } from 'react';
import { SubtitleSettings, VisualEffectType, EffectSlot } from '../types';

interface SettingsPanelProps {
  settings: SubtitleSettings;
  onChange: (settings: SubtitleSettings) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onChange }) => {
  const [openSlot, setOpenSlot] = useState<number | null>(0);

  const update = (key: keyof SubtitleSettings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  const updateEffectSlot = (index: number, slotUpdate: Partial<EffectSlot>) => {
    const newSlots = [...settings.effectSlots];
    newSlots[index] = { ...newSlots[index], ...slotUpdate };
    update('effectSlots', newSlots);
  };

  const effects: { label: string; value: VisualEffectType; icon: string }[] = [
    { label: 'Clean', value: 'none', icon: 'fa-ban' },
    { label: 'Grain', value: 'film-grain', icon: 'fa-clapperboard' },
    { label: 'Vintage', value: 'old-film', icon: 'fa-film' },
    { label: 'Nostalgia', value: 'sepia-70s', icon: 'fa-camera-retro' },
    { label: 'Cinema', value: 'cinema-lines', icon: 'fa-grip-lines-vertical' },
    { label: 'Leak', value: 'light-leaks', icon: 'fa-sun' },
    { label: 'Jitter', value: 'frame-jitter', icon: 'fa-arrows-rotate' },
    { label: 'Damage', value: 'damaged-negative', icon: 'fa-burst' },
    { label: 'Static', value: 'vertical-dust', icon: 'fa-barcode' },
    { label: 'VHS', value: 'vhs-glitch', icon: 'fa-compact-disc' },
    { label: 'Embers', value: 'fire-embers', icon: 'fa-fire' },
    { label: 'Focus', value: 'vignette', icon: 'fa-circle-dot' },
    { label: 'Scanline', value: 'crt-lines', icon: 'fa-tv' },
  ];

  const fontFamilies = [
    { label: 'DM Sans', value: 'DM Sans' },
    { label: 'Inter', value: 'Inter' },
    { label: 'Montserrat', value: 'Montserrat' },
    { label: 'Bebas Neue', value: 'Bebas Neue' },
  ];

  return (
    <div className="w-85 liquid-glass p-8 flex flex-col gap-8 overflow-y-auto z-20 custom-scrollbar">
      <div className="flex items-center gap-5 mb-2">
        <div className="w-12 h-12 rounded-[18px] liquid-button flex items-center justify-center text-[#00A3FF] shadow-[0_10px_30px_rgba(0,163,255,0.15)]">
            <i className="fas fa-bolt text-xl"></i>
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white">
            Vinci Studio
          </h2>
          <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.4em]">Engine v2.5.0</p>
        </div>
      </div>

      {/* Effects Stack */}
      <section className="space-y-5">
        <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em] px-1">Processing Engine</h3>
        <div className="space-y-4">
          {settings.effectSlots.map((slot, idx) => (
            <div key={idx} className="rounded-[28px] overflow-hidden liquid-button bg-white/[0.01]">
              <button 
                onClick={() => setOpenSlot(openSlot === idx ? null : idx)}
                className={`w-full px-6 py-5 flex items-center justify-between text-xs transition-all ${
                  openSlot === idx ? 'bg-white/[0.1] text-[#00A3FF]' : 'text-white/80 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black opacity-50 tracking-widest text-white">LAYER {idx + 1}</span>
                  <span className="font-black uppercase tracking-[0.15em]">
                    {slot.type === 'none' ? 'Bypass' : effects.find(e => e.value === slot.type)?.label}
                  </span>
                </div>
                <i className={`fas fa-chevron-right text-[10px] transition-transform ${openSlot === idx ? 'rotate-90' : ''}`}></i>
              </button>

              {openSlot === idx && (
                <div className="p-7 bg-black/40 border-t border-white/10 space-y-7 animate-in fade-in duration-500 slide-in-from-top-2">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em]">Mixing Alpha</label>
                      <span className="text-xs font-black text-[#00A3FF] tabular-nums">{Math.round(slot.strength * 100)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.01"
                      value={slot.strength}
                      onChange={(e) => updateEffectSlot(idx, { strength: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {effects.map((effect) => (
                      <button
                        key={effect.value}
                        onClick={() => updateEffectSlot(idx, { type: effect.value })}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl liquid-button text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                          slot.type === effect.value
                            ? 'btn-neon-blue border-[#00A3FF]/60 text-[#00A3FF]'
                            : 'text-white/60 border-white/10 hover:text-white'
                        }`}
                      >
                        <i className={`fas ${effect.icon} text-xs`}></i>
                        <span className="truncate">{effect.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Optics */}
      <section className="space-y-6 pt-6 border-t border-white/10">
        <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em] px-1">Optics</h3>
        <div className="space-y-4 px-1">
          <div className="flex justify-between items-end">
            <label className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em]">Motion Blur</label>
            <span className="text-xs font-black text-[#BF00FF] tabular-nums">{Math.round(settings.zoomIntensity * 100)}%</span>
          </div>
          <input 
            type="range" min="0" max="3" step="0.1"
            value={settings.zoomIntensity}
            onChange={(e) => update('zoomIntensity', parseFloat(e.target.value))}
            className="w-full"
            style={{ accentColor: '#BF00FF' }}
          />
        </div>
      </section>

      {/* Typography & Stroke */}
      <section className="space-y-7 pt-6 border-t border-white/10">
        <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em] px-1">Graphics & Stroke</h3>
        
        <div className="space-y-3">
           <label className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em] px-1">Global Font</label>
           <div className="grid grid-cols-2 gap-3">
             {fontFamilies.map(f => (
               <button 
                key={f.value}
                onClick={() => update('fontFamily', f.value)}
                className={`px-4 py-3 rounded-2xl liquid-button text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                  settings.fontFamily === f.value ? 'btn-neon-blue text-[#00A3FF]' : 'text-white/60 hover:text-white'
                }`}
               >
                 {f.label}
               </button>
             ))}
           </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => update('fontWeight', settings.fontWeight === 'bold' ? 'normal' : 'bold')}
            className={`flex-1 py-4 rounded-[20px] liquid-button text-[10px] font-black uppercase tracking-[0.3em] transition-all ${
              settings.fontWeight === 'bold' ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'text-white/60'
            }`}
          >
            Bold
          </button>
          <button 
            onClick={() => update('fontStyle', settings.fontStyle === 'italic' ? 'normal' : 'italic')}
            className={`flex-1 py-4 rounded-[20px] liquid-button text-[10px] italic font-black uppercase tracking-[0.3em] transition-all ${
              settings.fontStyle === 'italic' ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'text-white/60'
            }`}
          >
            Italic
          </button>
        </div>

        {/* Text Stroke Section */}
        <div className="space-y-4 px-1">
          <div className="flex justify-between items-end">
            <label className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em]">Outline Width</label>
            <span className="text-xs font-black text-[#00A3FF] tabular-nums">{settings.outlineWidth}px</span>
          </div>
          <input 
            type="range" min="0" max="10" step="0.5"
            value={settings.outlineWidth}
            onChange={(e) => update('outlineWidth', parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex items-center justify-between gap-4 mt-2">
            <label className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em]">Outline Color</label>
            <div className="relative h-[32px] w-32">
              <input 
                type="color" value={settings.outlineColor}
                onChange={(e) => update('outlineColor', e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div 
                className="w-full h-full rounded-xl liquid-button border border-white/20 flex items-center justify-center gap-2"
              >
                <div className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: settings.outlineColor }}></div>
                <span className="text-[8px] font-black uppercase text-white/80">{settings.outlineColor}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em] px-1">Text Pt</label>
            <div className="liquid-button bg-white/[0.05] rounded-2xl p-4 flex items-center justify-center border border-white/10">
              <input 
                type="number" 
                value={settings.fontSize || ''}
                onChange={(e) => update('fontSize', parseInt(e.target.value) || 0)}
                className="bg-transparent w-full text-center text-sm font-black outline-none text-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em] px-1">Chroma</label>
            <div className="relative h-[52px]">
              <input 
                type="color" value={settings.fontColor}
                onChange={(e) => update('fontColor', e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div 
                className="w-full h-full rounded-2xl liquid-button border border-white/20 flex items-center justify-center"
                style={{ backgroundColor: settings.fontColor + '30' }}
              >
                <div className="w-5 h-5 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] border-2 border-white/40" style={{ backgroundColor: settings.fontColor }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-auto pt-8 border-t border-white/10 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.5em] text-white/40">
        <span>Render Pipeline 8.4</span>
        <span className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00A3FF] animate-pulse"></div>
          Active
        </span>
      </div>
    </div>
  );
};

export default SettingsPanel;
