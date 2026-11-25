import { useEffect, useRef, useState } from 'react';
import type { RoomConfig } from '../data/havenData';
import { formatClockHms } from '../lib/havenLogic';
import { ExpandIcon, ShrinkIcon } from './Icons';

interface CameraCardProps {
  room: RoomConfig;
  expanded: boolean;
  onToggleExpand: () => void;
  introHidden: boolean;
  spotlight: boolean;
  recMode: boolean;
  recClockRef: React.MutableRefObject<number>;
  scanlinesEnabled: boolean;
}

export function CameraCard({
  room,
  expanded,
  onToggleExpand,
  introHidden,
  spotlight,
  recMode,
  recClockRef,
  scanlinesEnabled,
}: CameraCardProps) {
  const [displayedRoom, setDisplayedRoom] = useState<RoomConfig>(room);
  const [wipePhase, setWipePhase] = useState<'idle' | 'in' | 'out'>('idle');
  const [clockSec, setClockSec] = useState<number>(9 * 3600 + 41 * 60 + 7);
  const [imgFailed, setImgFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const prevRoomIdRef = useRef<string>(room.id);

  // Live REC clock ticking every second
  useEffect(() => {
    const id = window.setInterval(() => {
      setClockSec((s) => (s + 1) % 86400);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Wipe curtain transition when room switches
  useEffect(() => {
    if (room.id === prevRoomIdRef.current) {
      setDisplayedRoom(room);
      return;
    }
    prevRoomIdRef.current = room.id;
    setImgFailed(false);
    setWipePhase('in');

    const swapTimer = window.setTimeout(() => {
      setDisplayedRoom(room);
      setWipePhase('out');
    }, 250);

    const doneTimer = window.setTimeout(() => {
      setWipePhase('idle');
    }, 660);

    return () => {
      window.clearTimeout(swapTimer);
      window.clearTimeout(doneTimer);
    };
  }, [room]);

  // Step camera video deterministically in ?rec mode
  useEffect(() => {
    if (!recMode || displayedRoom.cameraKind !== 'video') return;
    let rafId = 0;
    const step = () => {
      const video = videoRef.current;
      if (video && video.duration && Number.isFinite(video.duration)) {
        if (!video.paused) video.pause();
        video.currentTime = recClockRef.current % video.duration;
      }
      rafId = window.requestAnimationFrame(step);
    };
    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [recMode, displayedRoom.cameraKind, recClockRef]);

  return (
    <div
      className={`inner-card card-camera ${expanded ? 'camera-expanded' : ''} ${introHidden ? 'card-intro-hidden' : ''} ${spotlight ? 'card-spotlight' : ''}`}
      style={{ transitionDelay: introHidden ? '0ms' : '0ms' }}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        aria-label={
          expanded
            ? `Dock ${displayedRoom.cameraLabel} live camera`
            : `Expand ${displayedRoom.cameraLabel} live camera`
        }
        aria-expanded={expanded}
        className="relative block w-full h-full text-left p-0 overflow-hidden rounded-[inherit]"
      >
        {/* Feed media */}
        {displayedRoom.cameraKind === 'video' ? (
          <video
            ref={videoRef}
            className="camera-video-feed"
            src={displayedRoom.cameraSrc}
            poster={displayedRoom.cameraPoster}
            autoPlay={!recMode}
            muted
            loop
            playsInline
            preload="auto"
          />
        ) : !imgFailed ? (
          <img
            key={displayedRoom.cameraSrc}
            src={displayedRoom.cameraSrc}
            alt={`${displayedRoom.cameraLabel} live camera view`}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="camera-still-feed"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, rgba(126,232,208,0.22), rgba(24,28,24,0.92))',
            }}
          >
            <span className="text-[1.4rem] text-white/60 font-medium">
              {displayedRoom.cameraLabel} feed
            </span>
          </div>
        )}

        {/* CRT scanlines */}
        {scanlinesEnabled && <div aria-hidden="true" className="camera-scanlines" />}

        {/* Top & bottom readability scrims */}
        <div aria-hidden="true" className="camera-scrim" />

        {/* Room-switch dark wipe curtain */}
        <div
          aria-hidden="true"
          className={`camera-curtain ${
            wipePhase === 'in'
              ? 'wiping-in'
              : wipePhase === 'out'
                ? 'wiping-out'
                : ''
          }`}
        />

        {/* Top overlay bar */}
        <div className="absolute top-[1.6rem] left-[1.8rem] right-[1.8rem] flex items-center justify-between z-10 pointer-events-none">
          <span className="live-chip">
            <span className="live-dot" aria-hidden="true" />
            <span>Live</span>
          </span>
          <div className="flex items-center gap-[0.8rem]">
            <span className="rec-clock" data-testid="camera-rec-clock">
              REC · {formatClockHms(clockSec)}
            </span>
            <span className="w-[3.2rem] h-[3.2rem] rounded-full bg-black/35 border border-white/15 backdrop-blur-md inline-flex items-center justify-center text-white/85">
              {expanded ? (
                <ShrinkIcon className="w-[1.5rem] h-[1.5rem]" />
              ) : (
                <ExpandIcon className="w-[1.5rem] h-[1.5rem]" />
              )}
            </span>
          </div>
        </div>

        {/* Bottom label */}
        <div className="absolute bottom-[1.6rem] left-[1.8rem] right-[1.8rem] flex items-end justify-between z-10 pointer-events-none">
          <div>
            <div className="text-[2rem] font-semibold leading-tight tracking-[-0.02em] text-white">
              <span className="roll-text-wrap">
                <span key={displayedRoom.id} className="roll-text-inner">
                  {displayedRoom.cameraLabel}
                </span>
              </span>
            </div>
            <div className="text-[1.35rem] font-medium text-white/70 mt-[0.15rem]">
              Live camera
            </div>
          </div>
          {expanded && (
            <span className="text-[1.25rem] font-medium text-white/75 px-[1.2rem] py-[0.5rem] rounded-full bg-black/40 border border-white/15 backdrop-blur-md">
              Click anywhere to dock
            </span>
          )}
        </div>
      </button>
    </div>
  );
}
