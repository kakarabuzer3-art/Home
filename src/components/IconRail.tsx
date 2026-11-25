import { RAIL_ITEMS, type RailSectionId } from '../data/havenData';
import {
  BulbIcon,
  GearIcon,
  HomeIcon,
  ShieldIcon,
  ThermometerIcon,
} from './Icons';

interface IconRailProps {
  activeSection: RailSectionId;
  onSelectSection: (section: RailSectionId) => void;
  introRevealed: boolean;
}

function renderRailIcon(id: RailSectionId) {
  const cls = 'w-[2.1rem] h-[2.1rem]';
  switch (id) {
    case 'home':
      return <HomeIcon className={cls} />;
    case 'lighting':
      return <BulbIcon className={cls} />;
    case 'climate':
      return <ThermometerIcon className={cls} />;
    case 'security':
      return <ShieldIcon className={cls} />;
    case 'settings':
      return <GearIcon className={cls} />;
  }
}

export function IconRail({
  activeSection,
  onSelectSection,
  introRevealed,
}: IconRailProps) {
  return (
    <aside
      aria-label="Smart home sections"
      className={`icon-rail glass ${introRevealed ? '' : 'intro-hidden'}`}
    >
      {RAIL_ITEMS.map((item, idx) => {
        const isActive = item.id === activeSection;
        return (
          <div key={item.id} className="rail-btn-wrap">
            <button
              type="button"
              aria-label={item.label}
              aria-pressed={isActive}
              onClick={() => onSelectSection(item.id)}
              className={`rail-btn ${isActive ? 'active' : ''} ${introRevealed ? '' : 'intro-pop'}`}
              style={{
                transitionDelay: introRevealed ? `${idx * 65}ms` : '0ms',
              }}
            >
              {renderRailIcon(item.id)}
            </button>
            <span role="tooltip" className="rail-tooltip">
              {item.label}
            </span>
          </div>
        );
      })}
    </aside>
  );
}
