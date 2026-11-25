import type { RoomConfig } from '../data/havenData';
import {
  DishwasherIcon,
  HomeIcon,
  PurifierIcon,
  RobotVacuumIcon,
  TowelWarmerIcon,
} from './Icons';

interface ApplianceCardProps {
  room: RoomConfig;
  active: boolean;
  progress: number;
  onToggle: () => void;
  introHidden: boolean;
  spotlight: boolean;
}

function renderApplianceIcon(kind: RoomConfig['applianceIcon'], spinning: boolean) {
  const cls = `w-[2.2rem] h-[2.2rem] ${spinning ? 'spin-slow' : ''}`;
  switch (kind) {
    case 'vacuum':
      return <RobotVacuumIcon className={cls} />;
    case 'dishwasher':
      return <DishwasherIcon className={cls} />;
    case 'towel':
      return <TowelWarmerIcon className={cls} />;
    case 'purifier':
      return <PurifierIcon className={cls} />;
  }
}

export function ApplianceCard({
  room,
  active,
  progress,
  onToggle,
  introHidden,
  spotlight,
}: ApplianceCardProps) {
  const statusTopRight = active ? `${progress}%` : room.applianceIdleStatus;
  const subLine = active ? room.applianceActiveSub(progress) : room.applianceIdleStatus;

  return (
    <section
      aria-label={room.applianceTitle}
      className={`inner-card card-appliance ${introHidden ? 'card-intro-hidden' : ''} ${spotlight ? 'card-spotlight' : ''}`}
      style={{ transitionDelay: introHidden ? '0ms' : '210ms' }}
    >
      {/* Top icons and status */}
      <div className="flex items-start justify-between gap-[0.6rem]">
        <div className="flex items-center gap-[0.65rem]">
          <div
            className="appliance-icon-primary w-[4.4rem] h-[4.4rem] rounded-full flex items-center justify-center transition-colors duration-300"
            style={{
              background: active
                ? 'rgba(126, 232, 208, 0.22)'
                : 'rgba(255, 255, 255, 0.11)',
              border: active
                ? '1px solid rgba(142, 240, 214, 0.45)'
                : '1px solid rgba(255, 255, 255, 0.14)',
              color: active ? '#e3fbb0' : '#ffffff',
            }}
            aria-hidden="true"
          >
            {renderApplianceIcon(room.applianceIcon, active)}
          </div>
          <div
            className="appliance-icon-dock w-[3.4rem] h-[3.4rem] rounded-full flex items-center justify-center bg-white/10 border border-white/12 text-white/75"
            aria-hidden="true"
          >
            <HomeIcon className="w-[1.5rem] h-[1.5rem]" />
          </div>
        </div>

        <span
          data-testid="appliance-status"
          className="text-[1.3rem] font-semibold tabular-nums transition-colors duration-300 shrink-0"
          style={{ color: active ? '#8ef0d6' : 'rgba(255,255,255,0.68)' }}
        >
          {statusTopRight}
        </span>
      </div>

      {/* Mint progress bar */}
      <div className="my-auto py-[0.8rem]">
        <div
          className="w-full h-[0.6rem] rounded-full overflow-hidden transition-opacity duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            opacity: active ? 1 : 0.35,
          }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{
              width: `${active ? Math.max(4, progress) : 0}%`,
              background: 'var(--grad)',
            }}
          />
        </div>
      </div>

      {/* Bottom title + toggle */}
      <div className="appliance-title-row flex items-end justify-between gap-[1rem]">
        <div className="min-w-0 w-full">
          <div className="text-[1.65rem] font-semibold leading-tight text-white truncate">
            <span className="roll-text-wrap">
              <span key={room.id} className="roll-text-inner" style={{ animationDelay: '80ms' }}>
                {room.applianceTitle}
              </span>
            </span>
          </div>
          <div
            data-testid="appliance-subline"
            className="text-[1.25rem] font-medium text-[var(--muted)] mt-[0.25rem] tabular-nums truncate"
          >
            {subLine}
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={active}
          aria-label={`Toggle ${room.applianceTitle}`}
          onClick={onToggle}
          className="haven-toggle"
        >
          <span className="haven-toggle-thumb" />
        </button>
      </div>
    </section>
  );
}
