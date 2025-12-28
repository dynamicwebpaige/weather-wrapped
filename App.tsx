
import React, { useState, useCallback } from 'react';
import CelebrationBackground from './components/CelebrationBackground';
import TimelapsePlayer from './components/TimelapsePlayer';
import { geocodeCity } from './services/geocodingService';
import { getTileCoords, generateWrappedDates } from './services/nasaService';
import { AppState, WrappedData, LocationInfo } from './types';

const App: React.FC = () => {
  const [cityInput, setCityInput] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [wrappedData, setWrappedData] = useState<WrappedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;

    setError(null);
    setAppState(AppState.GEOCODING);

    const location = await geocodeCity(cityInput);
    if (!location) {
      setError("We couldn't find that place on Earth! Try again.");
      setAppState(AppState.IDLE);
      return;
    }

    const tile = getTileCoords(location.lat, location.lon);
    const dates = generateWrappedDates();

    if (dates.length === 0) {
      setError("No satellite data available for this range yet!");
      setAppState(AppState.IDLE);
      return;
    }

    setWrappedData({
      location,
      tile,
      dates
    });

    setAppState(AppState.VIEWING_WRAPPED);
  };

  const reset = () => {
    setAppState(AppState.IDLE);
    setWrappedData(null);
    setCityInput('');
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4">
      <CelebrationBackground />

      <header className="mb-12 text-center animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
            NASA GIBS DATA
          </span>
          <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
            2025 WRAPPED
          </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold playfair text-white mb-2 tracking-tight">
          Weather <span className="text-amber-500 italic">Wrapped</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
          Relive the changes of our planet from above. Enter your city to generate your personalized 2025 satellite odyssey.
        </p>
      </header>

      <main className="w-full max-w-4xl">
        {appState === AppState.IDLE && (
          <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl max-w-xl mx-auto transition-all">
            <h2 className="text-2xl font-semibold mb-6 text-center text-white">Where did you live in 2025?</h2>
            <form onSubmit={handleGenerate} className="flex flex-col gap-4">
              <div className="relative">
                <i className="fa-solid fa-earth-americas absolute left-5 top-1/2 -translate-y-1/2 text-slate-500"></i>
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="Enter City Name (e.g. Paris, Itasca, TX)"
                  className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all placeholder:text-slate-500"
                />
              </div>
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 text-lg shadow-lg shadow-amber-500/20"
              >
                <span>Generate Wrapped</span>
                <i className="fa-solid fa-wand-magic-sparkles"></i>
              </button>
              {error && (
                <p className="text-red-400 text-sm mt-2 text-center font-medium">{error}</p>
              )}
            </form>
            <div className="mt-10 pt-8 border-t border-white/5 grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-amber-500 font-bold text-xl">2025</div>
                <div className="text-slate-500 text-xs uppercase tracking-widest font-bold">Year Focused</div>
              </div>
              <div>
                <div className="text-blue-400 font-bold text-xl">HD</div>
                <div className="text-slate-500 text-xs uppercase tracking-widest font-bold">Satellite Imagery</div>
              </div>
            </div>
          </div>
        )}

        {appState === AppState.GEOCODING && (
          <div className="flex flex-col items-center justify-center p-20 bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-500 mb-6"></div>
            <p className="text-xl font-bold playfair text-white">Locating your coordinates...</p>
            <p className="text-slate-400 text-sm mt-2">Checking with the satellites.</p>
          </div>
        )}

        {appState === AppState.VIEWING_WRAPPED && wrappedData && (
          <div className="animate-fade-in space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
              <div>
                <h2 className="text-3xl font-bold playfair text-white">
                  {wrappedData.location.name} <span className="text-amber-500">2025</span>
                </h2>
                <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
                  <i className="fa-solid fa-satellite text-amber-500/50"></i>
                  {wrappedData.location.address}
                </p>
              </div>
              <button 
                onClick={reset}
                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-full text-sm font-bold border border-white/10 transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-arrow-left"></i>
                Try Another Location
              </button>
            </div>

            <TimelapsePlayer data={wrappedData} />

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
              <div className="p-6 bg-slate-900/40 rounded-3xl border border-white/10">
                <i className="fa-solid fa-sun text-2xl text-amber-500 mb-3"></i>
                <h3 className="text-white font-bold mb-1">Clear Skies</h3>
                <p className="text-slate-400 text-xs">Observe the brightest days of your seasonal shifts.</p>
              </div>
              <div className="p-6 bg-slate-900/40 rounded-3xl border border-white/10">
                <i className="fa-solid fa-snowflake text-2xl text-blue-400 mb-3"></i>
                <h3 className="text-white font-bold mb-1">Atmospheric Flow</h3>
                <p className="text-slate-400 text-xs">Track the cloud cover changes across your region.</p>
              </div>
              <div className="p-6 bg-slate-900/40 rounded-3xl border border-white/10">
                <i className="fa-solid fa-cloud-bolt text-2xl text-slate-400 mb-3"></i>
                <h3 className="text-white font-bold mb-1">Global Vision</h3>
                <p className="text-slate-400 text-xs">Direct imagery from NASA's Terra satellite.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-20 text-center py-8 border-t border-white/5 w-full max-w-4xl">
        <p className="text-slate-500 text-sm mb-4">
          Brought to you by <span className="text-slate-300 font-bold">NASA GIBS</span> & Science.
        </p>
        <div className="flex items-center justify-center gap-6 text-slate-600 text-3xl mb-6">
          <a href="https://www.github.com/dynamicwebpaige/weather-wrapped" target="_blank" rel="noopener noreferrer">
            <i className="fa-brands fa-github hover:text-white transition-colors cursor-pointer"></i>
          </a>
          <a href="https://twitter.com/dynamicwebpaige" target="_blank" rel="noopener noreferrer">
            <i className="fa-brands fa-x-twitter hover:text-white transition-colors cursor-pointer"></i>
          </a>
        </div>
        <div className="playfair italic text-3xl text-amber-500/80 font-bold animate-pulse">
          Happy New Year 2026!
        </div>
      </footer>
    </div>
  );
};

export default App;
