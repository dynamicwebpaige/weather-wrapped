
import React, { useState, useEffect, useRef } from 'react';
import { WrappedData } from '../types';
import { getGibsUrl, getPixelCoords } from '../services/nasaService';
import { NASA_LOGO_URL } from '../constants';

interface TimelapsePlayerProps {
  data: WrappedData;
}

const TimelapsePlayer: React.FC<TimelapsePlayerProps> = ({ data }) => {
  const [loadedCount, setLoadedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [status, setStatus] = useState<'loading' | 'stitching' | 'ready' | 'error'>('loading');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { row, col, zoom } = data.tile;

  useEffect(() => {
    let isMounted = true;
    const entries = data.dates.map(d => ({
      url: getGibsUrl(d, row, col, zoom),
      date: d
    }));

    const total = entries.length;
    const loadedImages: { img: HTMLImageElement, date: string }[] = [];
    let processedCount = 0;

    const startStitching = async (validImages: { img: HTMLImageElement, date: string }[]) => {
      if (!isMounted || validImages.length === 0) return;
      setStatus('stitching');

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 512;
      canvas.height = 512;

      const stream = canvas.captureStream(20); // 20 FPS
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm'
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        if (isMounted) {
          setVideoUrl(url);
          setStatus('ready');
        }
      };

      recorder.start();

      const pin = getPixelCoords(data.location.lat, data.location.lon, row, col, zoom);

      for (const item of validImages) {
        ctx.drawImage(item.img, 0, 0, 512, 512);

        const grad = ctx.createLinearGradient(0, 400, 0, 512);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 400, 512, 112);

        ctx.beginPath();
        ctx.arc(pin.x, pin.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 24px Outfit, sans-serif';
        ctx.fillText(item.date, 20, 480);

        ctx.fillStyle = 'white';
        ctx.font = '16px Outfit, sans-serif';
        ctx.fillText(data.location.name, 20, 500);

        await new Promise(r => setTimeout(r, 50)); 
      }

      recorder.stop();
    };

    const loadImage = (entry: {url: string, date: string}) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = entry.url;
      img.onload = () => {
        if (!isMounted) return;
        loadedImages.push({ img, date: entry.date });
        processedCount++;
        setLoadedCount(prev => prev + 1);
        if (processedCount === total) {
          loadedImages.sort((a, b) => a.date.localeCompare(b.date));
          startStitching(loadedImages);
        }
      };
      img.onerror = () => {
        if (!isMounted) return;
        processedCount++;
        setFailedCount(prev => prev + 1);
        if (processedCount === total) {
          loadedImages.sort((a, b) => a.date.localeCompare(b.date));
          startStitching(loadedImages);
        }
      };
    };

    entries.forEach(loadImage);

    return () => {
      isMounted = false;
    };
  }, [data, row, col, zoom]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (status === 'loading' || status === 'stitching') {
    const total = data.dates.length;
    const progress = Math.round(((loadedCount + failedCount) / total) * 100);
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 rounded-3xl border border-white/10 backdrop-blur-md text-center max-w-xl mx-auto shadow-2xl">
        <div className="relative mb-8">
          <div className="w-24 h-24 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-amber-500 font-bold">
            {progress}%
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2 playfair text-white">
          {status === 'loading' ? 'Downloading Satellite History...' : 'Stitching Your 2025 Video...'}
        </h2>
        <p className="text-slate-400 text-sm max-w-xs mx-auto">
          We're fetching high-resolution tiles from NASA GIBS to create your year in review.
        </p>
        <div className="hidden"><canvas ref={canvasRef} /></div>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="text-center p-12 bg-slate-900/50 rounded-3xl border border-white/10">
        <i className="fa-solid fa-triangle-exclamation text-amber-500 text-4xl mb-4"></i>
        <h3 className="text-xl font-bold text-white">Something went wrong</h3>
      </div>
    );
  }

  return (
    <div className="relative group w-full max-w-2xl mx-auto animate-fade-in">
      <div 
        className="relative aspect-square rounded-[2.5rem] overflow-hidden border-8 border-slate-900 shadow-2xl shadow-black/80 bg-black cursor-pointer"
        onClick={togglePlay}
      >
        <video 
          ref={videoRef}
          src={videoUrl} 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover"
        />

        <div className="absolute top-6 left-6 w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl p-2 flex items-center justify-center border border-white/10">
          <img src={NASA_LOGO_URL} alt="NASA Logo" className="w-full h-full object-contain" />
        </div>

        <div className="absolute top-6 right-6 pointer-events-none">
          <span className="bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-widest shadow-lg rotate-3 inline-block">
            2025 WRAPPED
          </span>
        </div>

        <div className="absolute bottom-24 right-8 text-amber-400/40 playfair italic font-black text-3xl select-none -rotate-12 pointer-events-none">
          Happy 2026!
        </div>

        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
          <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center text-slate-950 shadow-2xl scale-110">
            <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-3xl ml-${isPlaying ? '0' : '1'}`}></i>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <a 
          href={videoUrl} 
          download={`${data.location.name}_2025_Wrapped.webm`}
          className="flex items-center gap-2 bg-white text-slate-950 px-8 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95 shadow-xl"
        >
          <i className="fa-solid fa-download"></i>
          Save Your Year
        </a>
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-700 transition-all active:scale-95 border border-white/10"
        >
          <i className="fa-solid fa-repeat"></i>
          Make Another
        </button>
      </div>
    </div>
  );
};

export default TimelapsePlayer;
