import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, RefreshCw } from 'lucide-react';
import { api } from '../api/client';

interface Props {
  scanId: string;
  audioUrl?: string | null;
  onAudioRetried?: () => void;
}

export const AudioPlayer: React.FC<Props> = ({ scanId, audioUrl, onAudioRetried }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryMsg, setRetryMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.error(e));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const cycleRate = () => {
    const rates = [1.0, 1.25, 0.75];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(next);
  };

  const handleRetryAudio = async () => {
    try {
      setIsRetrying(true);
      setRetryMsg(null);
      await api.request(`/api/v1/scans/${scanId}/audio/retry`, { method: 'POST' });
      setRetryMsg('Audio synthesized! Refreshing...');
      setTimeout(() => {
        onAudioRetried?.();
      }, 1000);
    } catch (err: any) {
      setRetryMsg('Failed to retry audio generation.');
    } finally {
      setIsRetrying(false);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!audioUrl) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 my-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-amber-700" />
          <span className="text-sm font-medium text-amber-900">
            Audio explanation is currently unavailable for this scan.
          </span>
        </div>
        <button
          onClick={handleRetryAudio}
          disabled={isRetrying}
          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Synthesizing...' : 'Generate Audio'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-moss-700 text-white rounded-2xl p-5 shadow-lg my-5 border border-moss-800">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-moss-600/80 rounded-lg">
            <Volume2 className="w-5 h-5 text-moss-200" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-moss-200 block">
              Spoken Audio Explanation
            </span>
            <span className="text-sm font-medium text-white">Listen to instructions in your language</span>
          </div>
        </div>

        <button
          onClick={cycleRate}
          className="px-2.5 py-1 bg-moss-800 hover:bg-moss-900 text-moss-200 rounded-md text-xs font-semibold transition"
          title="Playback Speed"
        >
          {playbackRate}x speed
        </button>
      </div>

      {/* Progress Scrub Bar */}
      <div className="space-y-1 mb-3">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleScrub}
          className="w-full h-2 bg-moss-900/60 rounded-lg appearance-none cursor-pointer accent-clay-400"
        />
        <div className="flex justify-between text-[11px] text-moss-300 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Large Accessible Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
            }
          }}
          className="p-2 text-moss-200 hover:text-white transition"
          title="Rewind 10s"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={togglePlay}
          className="w-14 h-14 rounded-full bg-clay-500 hover:bg-clay-600 active:scale-95 text-white flex items-center justify-center shadow-lg transition"
          aria-label={isPlaying ? 'Pause audio explanation' : 'Play audio explanation'}
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
        </button>
      </div>

      {retryMsg && <p className="text-xs text-center text-moss-200 mt-2">{retryMsg}</p>}
    </div>
  );
};
