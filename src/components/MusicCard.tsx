import { useState } from 'react';
import type { Track } from '../data/havenData';
import { clamp, formatTrackTime } from '../lib/havenLogic';
import { MusicNoteIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon } from './Icons';

interface MusicCardProps {
  track: Track;
  prevCover: string | null;
  trackKey: number;
  playing: boolean;
  elapsedSec: number;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (sec: number) => void;
  introHidden: boolean;
  spotlight: boolean;
}

export function MusicCard({
  track,
  prevCover,
  trackKey,
  playing,
  elapsedSec,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  introHidden,
  spotlight,
}: MusicCardProps) {
  const [coverFailed, setCoverFailed] = useState<Record<string, boolean>>({});
  const pct = clamp((elapsedSec / track.durationSec) * 100, 0, 100);

  const handleBarClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    onSeek(Math.floor(ratio * track.durationSec));
  };

  return (
    <section
      aria-label="Music player"
      className={`inner-card card-music ${introHidden ? 'card-intro-hidden' : ''} ${spotlight ? 'card-spotlight' : ''}`}
      style={{ transitionDelay: introHidden ? '0ms' : '390ms' }}
    >
      {/* Left 15rem album art with clip-path wipe transition */}
      <div className="album-wrap">
        {prevCover && !coverFailed[prevCover] && (
          <img
            src={prevCover}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="album-img"
          />
        )}
        {!coverFailed[track.cover] ? (
          <img
            key={`${track.id}-${trackKey}`}
            src={track.cover}
            alt={`${track.title} by ${track.artist} album cover`}
            referrerPolicy="no-referrer"
            onError={() => setCoverFailed((prev) => ({ ...prev, [track.cover]: true }))}
            className={`album-img ${trackKey > 0 ? 'album-img-wipe' : ''}`}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'var(--grad)', color: '#103731' }}
          >
            <MusicNoteIcon className="w-[4rem] h-[4rem]" />
          </div>
        )}
      </div>

      {/* Right controls column */}
      <div className="flex-1 min-w-0 h-full flex flex-col justify-between py-[0.3rem]">
        {/* Top row: Now Playing chip + elapsed / duration */}
        <div className="music-header-row flex items-center justify-between gap-[0.8rem]">
          <div className="inline-flex items-center gap-[0.8rem] px-[1rem] py-[0.45rem] rounded-full bg-white/10 border border-white/14">
            <span
              className="w-[2.2rem] h-[2.2rem] rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--grad)', color: '#103731' }}
              aria-hidden="true"
            >
              <MusicNoteIcon className="w-[1.25rem] h-[1.25rem]" />
            </span>
            <span className="text-[1.2rem] font-semibold text-white/90 whitespace-nowrap">
              Now Playing
            </span>
            <span className={`eq-bars ${playing ? '' : 'paused'}`} aria-hidden="true">
              <span className="eq-bar" />
              <span className="eq-bar" />
              <span className="eq-bar" />
            </span>
          </div>

          <span
            data-testid="music-time"
            className="text-[1.25rem] font-semibold text-[var(--muted)] tabular-nums whitespace-nowrap"
          >
            {formatTrackTime(elapsedSec)} / {formatTrackTime(track.durationSec)}
          </span>
        </div>

        {/* Title & artist with rolling transition */}
        <div className="min-w-0 my-[0.2rem]">
          <div
            data-testid="music-title"
            className="text-[2.2rem] font-semibold leading-tight tracking-[-0.02em] text-white truncate"
          >
            <span className="roll-text-wrap">
              <span key={`t-${track.id}-${trackKey}`} className="roll-text-inner">
                {track.title}
              </span>
            </span>
          </div>
          <div
            data-testid="music-artist"
            className="text-[1.35rem] font-medium text-[var(--muted)] leading-tight mt-[0.2rem] truncate"
          >
            <span className="roll-text-wrap">
              <span
                key={`a-${track.id}-${trackKey}`}
                className="roll-text-inner"
                style={{ animationDelay: '55ms' }}
              >
                {track.artist}
              </span>
            </span>
          </div>
        </div>

        {/* Clickable progress bar + playback buttons */}
        <div className="flex flex-col gap-[1rem]">
          <button
            type="button"
            onClick={handleBarClick}
            aria-label="Seek track position"
            className="group relative w-full h-[1.4rem] flex items-center p-0"
          >
            <span className="w-full h-[0.42rem] rounded-full bg-white/16 overflow-hidden block">
              <span
                className="block h-full rounded-full transition-[width] duration-300 ease-linear"
                style={{ width: `${pct}%`, background: 'var(--grad)' }}
              />
            </span>
          </button>

          <div className="flex items-center gap-[1rem]">
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous track"
              className="w-[3.4rem] h-[3.4rem] rounded-full inline-flex items-center justify-center text-white/80 hover:text-white hover:bg-white/12 transition-all"
            >
              <PrevIcon className="w-[1.8rem] h-[1.8rem]" />
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              aria-label={playing ? 'Pause music' : 'Play music'}
              className="w-[4rem] h-[4rem] rounded-full inline-flex items-center justify-center bg-white text-[#151a17] shadow-md hover:scale-105 active:scale-95 transition-transform"
            >
              {playing ? (
                <PauseIcon className="w-[1.8rem] h-[1.8rem]" />
              ) : (
                <PlayIcon className="w-[1.8rem] h-[1.8rem] translate-x-[0.1rem]" />
              )}
            </button>

            <button
              type="button"
              onClick={onNext}
              aria-label="Next track"
              className="w-[3.4rem] h-[3.4rem] rounded-full inline-flex items-center justify-center text-white/80 hover:text-white hover:bg-white/12 transition-all"
            >
              <NextIcon className="w-[1.8rem] h-[1.8rem]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
