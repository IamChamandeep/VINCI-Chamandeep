import React, { useRef, useEffect, useState } from 'react';
import { ProjectState, Subtitle, Asset } from '../types';

interface PreviewAreaProps {
  state: ProjectState;
  totalDuration: number;
  onTogglePlay: () => void;
}

const PreviewArea: React.FC<PreviewAreaProps> = ({ state, totalDuration, onTogglePlay }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeSubtitle, setActiveSubtitle] = useState<Subtitle | null>(null);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  const [smoothTime, setSmoothTime] = useState(0);
  const anchorRef = useRef({ time: 0, wall: performance.now() });
  
  const embersRef = useRef<{x: number, y: number, s: number, v: number}[]>([]);
  const scratchesRef = useRef<{x: number, life: number}[]>([]);
  const persistentLinesRef = useRef<{x: number, opacity: number}[]>([]);

  const getStyleForIndex = (idx: number) => {
    const filters = [
      'contrast(1.1) saturate(1.2) brightness(1.05)', 
      'contrast(1.4) saturate(0.8) brightness(0.9)', 
      'sepia(0.3) contrast(1.1) brightness(1.1)',    
      'hue-rotate(-15deg) saturate(1.1)',           
      'none'                                         
    ];
    return {
      filter: filters[idx % filters.length],
      panDir: idx % 4 
    };
  };

  useEffect(() => {
    const preload = (asset: Asset) => {
      if (!imageCache.current.has(asset.url)) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = asset.url;
        img.onload = () => imageCache.current.set(asset.url, img);
      }
    };
    state.images.forEach(preload);
    state.overlays.forEach(preload);
  }, [state.images, state.overlays]);

  useEffect(() => {
    anchorRef.current = { 
        time: state.currentTime, 
        wall: performance.now() 
    };
    if (!state.isPlaying && !state.isRendering) {
        setSmoothTime(state.currentTime);
    }
  }, [state.currentTime, state.isRendering, state.isPlaying]);

  useEffect(() => {
    let frameId: number;
    const updateSmoothTime = () => {
      if (state.isPlaying || state.isRendering) {
        const now = performance.now();
        const elapsedSinceAnchor = (now - anchorRef.current.wall) / 1000;
        setSmoothTime(anchorRef.current.time + elapsedSinceAnchor);
      }
      frameId = requestAnimationFrame(updateSmoothTime);
    };

    frameId = requestAnimationFrame(updateSmoothTime);
    return () => cancelAnimationFrame(frameId);
  }, [state.isPlaying, state.isRendering]);

  useEffect(() => {
    const sub = state.subtitles.find(s => smoothTime >= s.startTime && smoothTime <= s.endTime);
    setActiveSubtitle(sub || null);
  }, [smoothTime, state.subtitles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { 
      alpha: false, 
      desynchronized: true,
      willReadFrequently: false 
    });
    if (!ctx) return;

    const wrapText = (text: string, maxWidth: number) => {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = words[0] || '';

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    const renderEffect = (type: string, strength: number, time: number) => {
      if (strength <= 0 || type === 'none') return;

      switch (type) {
        case 'film-grain': {
          ctx.save();
          ctx.globalAlpha = 0.12 * strength;
          const particleCount = state.isRendering ? 1500 : 8000;
          for (let i = 0; i < particleCount; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = state.isRendering ? 1.5 : (Math.random() * 2);
            ctx.fillStyle = '#888';
            ctx.fillRect(x, y, size, size);
          }
          ctx.restore();
          break;
        }
        case 'old-film': {
          ctx.save();
          if (Math.random() > 0.85) {
            ctx.globalAlpha = (Math.random() * 0.1) * strength;
            ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.globalAlpha = 0.3 * strength;
          const noiseDots = state.isRendering ? 5 : 12;
          for (let i = 0; i < noiseDots; i++) {
            if (Math.random() > 0.8) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const size = Math.random() * 3;
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
            }
          }
          if (Math.random() > 0.92 && scratchesRef.current.length < 2) {
            scratchesRef.current.push({ x: Math.random() * canvas.width, life: 8 + Math.random() * 15 });
          }
          ctx.strokeStyle = `rgba(0,0,0,${0.15 * strength})`;
          ctx.lineWidth = 1;
          scratchesRef.current.forEach((scratch) => {
            ctx.beginPath(); ctx.moveTo(scratch.x, 0); ctx.lineTo(scratch.x + (Math.random() - 0.5) * 1.5, canvas.height); ctx.stroke();
            scratch.life--;
          });
          scratchesRef.current = scratchesRef.current.filter(s => s.life > 0);
          ctx.restore();
          break;
        }
        case 'sepia-70s': {
          ctx.save();
          ctx.globalAlpha = 0.3 * strength;
          ctx.fillStyle = '#fbe9d0';
          ctx.globalCompositeOperation = 'multiply';
          ctx.fillRect(0,0, canvas.width, canvas.height);
          ctx.restore();
          break;
        }
        case 'cinema-lines': {
          ctx.save();
          if (persistentLinesRef.current.length < (state.isRendering ? 3 : 5)) {
            persistentLinesRef.current.push({ x: Math.random() * canvas.width, opacity: Math.random() });
          }
          ctx.strokeStyle = `rgba(0,0,0,${0.2 * strength})`;
          persistentLinesRef.current.forEach(line => {
             if (Math.random() > 0.2) {
               ctx.beginPath();
               ctx.lineWidth = 0.5 + Math.random();
               ctx.moveTo(line.x, 0);
               ctx.lineTo(line.x, canvas.height);
               ctx.stroke();
             }
             if (Math.random() > 0.99) line.x = Math.random() * canvas.width;
          });
          ctx.restore();
          break;
        }
        case 'light-leaks': {
          ctx.save();
          const x = (Math.sin(time * 0.5) + 1) / 2 * canvas.width;
          const y = (Math.cos(time * 0.3) + 1) / 2 * canvas.height;
          const grad = ctx.createRadialGradient(x, y, 0, x, y, canvas.width * 0.7);
          grad.addColorStop(0, `rgba(255, 120, 0, ${0.3 * strength})`);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = grad;
          ctx.fillRect(0,0, canvas.width, canvas.height);
          ctx.restore();
          break;
        }
        case 'frame-jitter': {
          const intensity = state.isRendering ? 2 : 5;
          const jitterX = (Math.random() - 0.5) * intensity * strength;
          const jitterY = (Math.random() - 0.5) * intensity * strength;
          ctx.translate(jitterX, jitterY);
          break;
        }
        case 'fire-embers': {
          ctx.save();
          const maxEmbers = state.isRendering ? 25 : 50;
          if (embersRef.current.length < maxEmbers) {
            embersRef.current.push({ x: Math.random() * canvas.width, y: canvas.height + 10, s: Math.random() * 3 + 1, v: Math.random() * 80 + 40 });
          }
          ctx.globalCompositeOperation = 'lighter';
          embersRef.current.forEach((e, i) => {
            e.y -= e.v * 0.016;
            e.x += Math.sin(time + i) * 0.3;
            ctx.fillStyle = `rgba(255, 100, 0, ${strength * 0.6})`;
            ctx.beginPath(); ctx.arc(e.x, e.y, e.s, 0, Math.PI * 2); ctx.fill();
            if (e.y < -10) {
              embersRef.current[i] = { x: Math.random() * canvas.width, y: canvas.height + 10, s: Math.random() * 3 + 1, v: Math.random() * 80 + 40 };
            }
          });
          ctx.restore();
          break;
        }
        case 'vignette': {
          ctx.save();
          const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.width * 0.4, canvas.width/2, canvas.height/2, canvas.width * 0.8);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(1, `rgba(0,0,0,${0.85 * strength})`);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.restore();
          break;
        }
        case 'crt-lines': {
          ctx.save();
          ctx.globalAlpha = 0.15 * strength;
          const step = state.isRendering ? 8 : 4;
          for (let i = 0; i < canvas.height; i += step) {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, i, canvas.width, 1);
          }
          ctx.restore();
          break;
        }
      }
    };

    const render = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); 
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (state.images.length > 0 && totalDuration > 0) {
        const settings = state.subtitleSettings;
        const autoStretch = settings.autoStretch ?? true;
        const fixedDuration = 5; 
        const segmentDuration = autoStretch ? (totalDuration / state.images.length) : fixedDuration;
        
        const currentIndex = Math.min(Math.floor(smoothTime / segmentDuration), state.images.length - 1);
        const nextIndex = Math.min(currentIndex + 1, state.images.length - 1);
        const timeInSegment = smoothTime % segmentDuration;
        const p = timeInSegment / segmentDuration;

        const drawKenBurnsImage = (idx: number, opacity: number, progressOverride?: number) => {
          const asset = state.images[idx];
          if (!asset) return;
          const img = imageCache.current.get(asset.url);
          if (!img) return;

          const currentP = progressOverride !== undefined ? progressOverride : p;
          const style = getStyleForIndex(idx);
          
          const zIntensity = settings.zoomIntensity ?? 1.0;
          const zoomBase = 1.0 + (0.15 * zIntensity);
          const zoomVar = 0.3 * zIntensity;
          const zoom = zoomBase + Math.sin(currentP * Math.PI) * zoomVar;
          
          let panX = 0, panY = 0;
          const moveIntensity = 60 * zIntensity;
          const move = Math.cos(currentP * Math.PI) * moveIntensity;
          
          switch(style.panDir) {
            case 0: panX = move; panY = move; break;
            case 1: panX = move; break;
            case 2: panY = move; break;
            case 3: panX = -move; panY = move; break;
          }

          ctx.save();
          ctx.globalAlpha = opacity;
          if (!state.isRendering) ctx.filter = style.filter;
          
          ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
          ctx.scale(zoom, zoom);
          ctx.translate(-canvas.width / 2, -canvas.height / 2);
          
          const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          ctx.restore();
        };

        const isCurrentlyViewing = autoStretch || (smoothTime < state.images.length * fixedDuration);

        if (isCurrentlyViewing) {
          const transitionTime = 1.0; 
          const remainingInSegment = segmentDuration - timeInSegment;
          let currentOpacity = 1;
          if (smoothTime < transitionTime / 2) currentOpacity = smoothTime / (transitionTime / 2);

          if (remainingInSegment < transitionTime && currentIndex < state.images.length - 1) {
            const fadeProgress = (transitionTime - remainingInSegment) / transitionTime;
            if (fadeProgress < 0.5) drawKenBurnsImage(currentIndex, (1 - (fadeProgress * 2)) * currentOpacity);
            else drawKenBurnsImage(nextIndex, (fadeProgress - 0.5) * 2, 0);
          } else {
            drawKenBurnsImage(currentIndex, currentOpacity);
          }
        }
      }

      state.subtitleSettings.effectSlots.forEach(slot => {
        renderEffect(slot.type, slot.strength, smoothTime);
      });

      const settings = state.subtitleSettings;
      const frameY = canvas.height * settings.frameHeight;

      state.overlays.forEach((overlay) => {
        const img = imageCache.current.get(overlay.url);
        if (img) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      });

      if (activeSubtitle) {
        ctx.save();
        const fontSize = (settings.fontSize || 29) * (canvas.height / 450); 
        const lineHeight = fontSize * 1.2;
        
        ctx.font = `${settings.fontStyle} ${settings.fontWeight} ${fontSize}px "${settings.fontFamily}"`;
        ctx.textAlign = 'center'; 
        ctx.textBaseline = 'middle';
        
        const maxWidth = canvas.width * 0.85;
        const fullLines = wrapText(activeSubtitle.text, maxWidth);
        
        const subDuration = activeSubtitle.endTime - activeSubtitle.startTime;
        const typewriterDuration = Math.min(1.5, subDuration * 0.8);
        const elapsed = smoothTime - activeSubtitle.startTime;
        const progress = Math.min(Math.max(elapsed / typewriterDuration, 0), 1);
        const totalCharsToDisplay = Math.floor(activeSubtitle.text.length * progress);
        
        let charsShown = 0;
        const totalHeight = fullLines.length * lineHeight;
        const startY = frameY - (totalHeight / 2) + (lineHeight / 2);

        fullLines.forEach((line, i) => {
          if (charsShown >= totalCharsToDisplay && i > 0) return;
          const remainingChars = totalCharsToDisplay - charsShown;
          const textInLine = line.substring(0, Math.max(0, Math.min(line.length, remainingChars)));
          if (textInLine.length === 0 && i > 0 && charsShown >= totalCharsToDisplay) return;

          const lineY = startY + (i * lineHeight);
          
          if (settings.outlineWidth > 0) {
            ctx.strokeStyle = settings.outlineColor;
            ctx.lineWidth = settings.outlineWidth * (canvas.height / 720); 
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.strokeText(textInLine, canvas.width / 2, lineY);
          }
          
          ctx.fillStyle = settings.fontColor;
          ctx.fillText(textInLine, canvas.width / 2, lineY);
          
          charsShown += line.length + (i < fullLines.length - 1 ? 1 : 0);
        });
        
        ctx.restore();
      }
    };

    const animFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrame);
  }, [smoothTime, state.images, activeSubtitle, state.subtitleSettings, state.overlays, totalDuration, state.isRendering]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative p-12">
      <div className="relative liquid-glass rounded-[40px] p-2 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
        <div className="rounded-[32px] overflow-hidden bg-black aspect-video max-h-[65vh] w-auto border border-white/5 relative">
          <canvas 
            ref={canvasRef} width={1920} height={1080} 
            className="w-full h-full block object-contain"
          />
          {!state.audio && !state.images.length && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <i className="fas fa-clapperboard text-4xl text-white/20"></i>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black tracking-tight text-white/60">Creative Workspace</p>
                    <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mt-1">Import Assets to Begin</p>
                  </div>
              </div>
          )}
        </div>
      </div>
      
      <div className="mt-12 flex items-center gap-10 liquid-glass px-10 py-5 rounded-full border border-white/5 shadow-2xl">
        <button className="text-zinc-500 hover:text-white transition-all text-xl" onClick={onTogglePlay} disabled={state.isRendering}>
            <i className="fas fa-backward-step"></i>
        </button>
        <button 
            className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.3)] disabled:opacity-50"
            onClick={onTogglePlay}
            disabled={state.isRendering}
        >
            <i className={`fas ${state.isPlaying ? 'fa-pause' : 'fa-play'} text-2xl ${state.isPlaying ? '' : 'ml-1'}`}></i>
        </button>
        <button className="text-zinc-500 hover:text-white transition-all text-xl" onClick={onTogglePlay} disabled={state.isRendering}>
            <i className="fas fa-forward-step"></i>
        </button>
      </div>
    </div>
  );
};

export default PreviewArea;