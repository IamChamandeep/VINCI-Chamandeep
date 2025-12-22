import React, { useState } from 'react';
import { SubtitleSettings } from '../types';

interface GlobalSettingsModalProps {
  currentDefaults: SubtitleSettings;
  onSave: (settings: SubtitleSettings) => void;
  onClose: () => void;
}

const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({ currentDefaults, onSave, onClose }) => {
  const [form, setForm] = useState<SubtitleSettings>({ ...currentDefaults });

  const update = (key: keyof SubtitleSettings, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const fontFamilies = [
    { label: 'DM Sans', value: 'DM Sans' },
    { label: 'Inter', value: 'Inter' },
    { label: 'Montserrat', value: 'Montserrat' },
    { label: 'Bebas Neue', value: 'Bebas Neue' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <i className="fas fa-sliders text-blue-500 text-lg"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold">Global Default Settings</h2>
              <p className="text-xs text-zinc-500 uppercase tracking-widest">Base configuration for new sessions</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Warning Box */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-4">
            <div className="text-amber-500 shrink-0 mt-0.5">
              <i className="fas fa-triangle-exclamation text-lg"></i>
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-500 uppercase">Warning: System-Wide Change</h4>
              <p className="text-sm text-zinc-400 mt-1 font-medium">
                Are you sure you want to make the default settings changes? This will override your persistent workspace baseline and apply to all new elements.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            {/* Typography Group */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Default Typography</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Font Family</label>
                <select 
                  value={form.fontFamily}
                  onChange={(e) => update('fontFamily', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                >
                  {fontFamilies.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Base Font Size</label>
                  <input 
                    type="number" value={form.fontSize}
                    onChange={(e) => update('fontSize', parseInt(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Text Color</label>
                  <input 
                    type="color" value={form.fontColor}
                    onChange={(e) => update('fontColor', e.target.value)}
                    className="w-full h-9 bg-zinc-950 border border-zinc-800 rounded-lg p-1 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => update('fontWeight', form.fontWeight === 'bold' ? 'normal' : 'bold')}
                  className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${
                    form.fontWeight === 'bold' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                  }`}
                >
                  Bold
                </button>
                <button 
                  onClick={() => update('fontStyle', form.fontStyle === 'italic' ? 'normal' : 'italic')}
                  className={`flex-1 py-2 rounded-lg border text-xs italic transition-all ${
                    form.fontStyle === 'italic' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                  }`}
                >
                  Italic
                </button>
              </div>
            </div>

            {/* Visuals Group */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Default Visuals & Stroke</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 block">Zoom Effect Intensity ({Math.round(form.zoomIntensity * 100)}%)</label>
                <input 
                  type="range" min="0" max="3" step="0.1"
                  value={form.zoomIntensity}
                  onChange={(e) => update('zoomIntensity', parseFloat(e.target.value))}
                  className="w-full accent-blue-500 h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 block">Default Vertical Anchor ({Math.round(form.frameHeight * 100)}%)</label>
                <input 
                  type="range" min="0" max="1" step="0.01"
                  value={form.frameHeight}
                  onChange={(e) => update('frameHeight', parseFloat(e.target.value))}
                  className="w-full accent-blue-500 h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 block">Stroke Color</label>
                <input 
                  type="color" value={form.outlineColor}
                  onChange={(e) => update('outlineColor', e.target.value)}
                  className="w-full h-9 bg-zinc-950 border border-zinc-800 rounded-lg p-1 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 block">Stroke Size ({form.outlineWidth}px)</label>
                <input 
                  type="range" min="0" max="15" step="0.5"
                  value={form.outlineWidth}
                  onChange={(e) => update('outlineWidth', parseFloat(e.target.value))}
                  className="w-full accent-blue-500 h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-400">Auto-Stretch Visuals</span>
                <button 
                  onClick={() => update('autoStretch', !form.autoStretch)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${form.autoStretch ? 'bg-blue-600' : 'bg-zinc-800'}`}
                >
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.autoStretch ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(form)}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <i className="fas fa-check-circle"></i>
            Confirm Global Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettingsModal;