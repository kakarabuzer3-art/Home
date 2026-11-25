import type { RoomConfig } from '../data/havenData';
import { BulbIcon } from './Icons';

interface LightsCardProps {
  room: RoomConfig;
  lightsOn: boolean;
  brightness: number;
  onToggleLights: () => void;
  introHidden: boolean;
  spotlight: boolean;
}

export function LightsCard({
  room,
  lightsOn,
  brightness,
  onToggleLights,
  introHidden,
  spotlight,
}: LightsCardProps) {
  const glowAlpha = lightsOn ? (0.18 + (brightness / 100) * 0.65).toFixed(3) : '0';
  const glowRadius = lightsOn ? (1.2 + (brightness / 100) * 2.4).toFixed(2) : '0';

  return (
    <section
      aria-label={room.lightsTitle}
      className={`inner-card card-lights ${lightsOn ? 'lights-on' : ''} ${introHidden ? 'card-intro-hidden' : ''} ${spotlight ? 'card-spotlight' : ''}`}
      style={{ transitionDelay: introHidden ? '0ms' : '270ms' }}
    >
      {/* Top bulb icon with brightness-reactive warm glow + On/Off label */}
      <div className="flex items-start justify-between gap-[1rem]">
        <div
          className="relative w-[4.6rem] h-[4.6rem] rounded-full flex items-center justify-center transition-all duration-500"
          style={{
            background: lightsOn
              ? 'rgba(255, 252, 232, 0.55)'
              : 'rgba(255, 255, 255, 0.1)',
            border: lightsOn
              ? '1px solid rgba(255, 255, 255, 0.72)'
              : '1px solid rgba(255, 255, 255, 0.15)',
            color: lightsOn ? '#103731' : 'rgba(255, 255, 255, 0.7)',
            boxShadow: lightsOn
              ? `0 0 ${glowRadius}rem rgba(255, 241, 176, ${glowAlpha})`
              : 'none',
          }}
          aria-hidden="true"
        >
          <BulbIcon className="w-[2.3rem] h-[2.3rem]" />
        </div>

        <span
          data-testid="lights-status"
          className="text-[1.4rem] font-semibold transition-colors duration-300"
          style={{ color: lightsOn ? 'rgba(16, 55, 49, 0.85)' : 'rgba(255, 255, 255, 0.62)' }}
        >
          {lightsOn ? 'On' : 'Off'}
        </span>
      </div>

      {/* Bottom title + brightness + toggle */}
      <div className="lights-title-row flex items-end justify-between gap-[1rem]">
        <div className="min-w-0 w-full">
          <div
            className="text-[1.7rem] font-semibold leading-tight truncate transition-colors duration-300"
            style={{ color: lightsOn ? '#0e332d' : '#ffffff' }}
          >
            <span className="roll-text-wrap">
              <span key={room.id} className="roll-text-inner" style={{ animationDelay: '120ms' }}>
                {room.lightsTitle}
              </span>
            </span>
          </div>
          <div
            data-testid="lights-subline"
            className="text-[1.3rem] font-semibold mt-[0.25rem] tabular-nums transition-colors duration-300"
            style={{ color: lightsOn ? 'rgba(16, 55, 49, 0.74)' : 'rgba(255, 255, 255, 0.58)' }}
          >
            {lightsOn ? `On · ${Math.round(brightness)}%` : 'Off · 0%'}
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={lightsOn}
          aria-label={`Toggle ${room.lightsTitle}`}
          onClick={onToggleLights}
          className={`haven-toggle ${lightsOn ? 'on-mint' : ''}`}
        >
          <span className="haven-toggle-thumb" />
        </button>
      </div>
    </section>
  );
}
