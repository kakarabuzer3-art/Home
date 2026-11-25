import { useRef, useState } from 'react';
import type { RoomConfig } from '../data/havenData';
import { CoffeeIcon, DropletIcon, MoonIcon, PlayIcon, SunIcon } from './Icons';

interface ScenePillProps {
  room: RoomConfig;
  onPlayScene: () => void;
  introHidden: boolean;
  spotlight: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

function renderSceneIcon(kind: RoomConfig['sceneIcon']) {
  const cls = 'w-[2.4rem] h-[2.4rem]';
  switch (kind) {
    case 'sun':
      return <SunIcon className={cls} />;
    case 'coffee':
      return <CoffeeIcon className={cls} />;
    case 'droplet':
      return <DropletIcon className={cls} />;
    case 'moon':
      return <MoonIcon className={cls} />;
  }
}

export function ScenePill({
  room,
  onPlayScene,
  introHidden,
  spotlight,
}: ScenePillProps) {
  const [spinning, setSpinning] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const pillRef = useRef<HTMLDivElement | null>(null);
  const spinTimerRef = useRef<number | null>(null);

  const handlePlay = (e: React.MouseEvent<HTMLButtonElement>) => {
    const pill = pillRef.current;
    if (pill) {
      const rect = pill.getBoundingClientRect();
      const x = e.clientX ? e.clientX - rect.left : rect.width - 30;
      const y = e.clientY ? e.clientY - rect.top : rect.height / 2;
      const id = Date.now() + Math.random();
      setRipples((prev) => [...prev, { id, x, y }]);
      window.setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 1000);
    }

    if (spinTimerRef.current) {
      window.clearTimeout(spinTimerRef.current);
    }
    setSpinning(false);
    window.requestAnimationFrame(() => {
      setSpinning(true);
      spinTimerRef.current = window.setTimeout(() => {
        setSpinning(false);
      }, 2400);
    });

    onPlayScene();
  };

  return (
    <div
      ref={pillRef}
      className={`inner-card card-scene ${introHidden ? 'card-intro-hidden' : ''} ${spotlight ? 'card-spotlight' : ''}`}
      style={{ transitionDelay: introHidden ? '0ms' : '150ms' }}
    >
      {/* Lime ripples */}
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden="true"
          className="scene-ripple"
          style={{ left: `${r.x}px`, top: `${r.y}px` }}
        />
      ))}

      <div className="relative z-10 flex items-center gap-[1.2rem] min-w-0">
        <div className={`scene-sun-badge ${spinning ? 'spinning' : ''}`} aria-hidden="true">
          {renderSceneIcon(room.sceneIcon)}
        </div>
        <div className="min-w-0">
          <div className="text-[1.6rem] font-semibold leading-tight text-white truncate">
            <span className="roll-text-wrap">
              <span key={room.id} className="roll-text-inner" style={{ animationDelay: '40ms' }}>
                {room.sceneName}
              </span>
            </span>
          </div>
          <div className="text-[1.25rem] font-medium text-[var(--muted)] leading-tight mt-[0.2rem]">
            {room.sceneSubtitle}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePlay}
        aria-label={`Play ${room.sceneName} scene`}
        className="scene-play-btn"
      >
        <PlayIcon className="w-[1.6rem] h-[1.6rem] translate-x-[0.1rem]" />
      </button>
    </div>
  );
}
