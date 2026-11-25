import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RoomConfig, RoomId } from '../data/havenData';
import {
  BathIcon,
  BedIcon,
  HeartIcon,
  PlusIcon,
  SofaIcon,
  SparkIcon,
  UtensilsIcon,
} from './Icons';

interface TabBarProps {
  rooms: RoomConfig[];
  activeRoomId: RoomId;
  onSelectRoom: (id: RoomId) => void;
  onAddRoom: () => void;
  introRevealed: boolean;
}

function renderTabIcon(icon: RoomConfig['tabIcon']) {
  const cls = 'w-[1.8rem] h-[1.8rem] shrink-0';
  switch (icon) {
    case 'heart':
      return <HeartIcon className={cls} />;
    case 'sofa':
      return <SofaIcon className={cls} />;
    case 'utensils':
      return <UtensilsIcon className={cls} />;
    case 'bath':
      return <BathIcon className={cls} />;
    case 'bed':
      return <BedIcon className={cls} />;
    default:
      return <SparkIcon className={cls} />;
  }
}

export function TabBar({
  rooms,
  activeRoomId,
  onSelectRoom,
  onAddRoom,
  introRevealed,
}: TabBarProps) {
  const barRef = useRef<HTMLElement | null>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const measureIndicator = useCallback(() => {
    const bar = barRef.current;
    const activeBtn = btnRefs.current[activeRoomId];
    if (!bar || !activeBtn) return;
    setIndicator({
      left: activeBtn.offsetLeft,
      width: activeBtn.offsetWidth,
      ready: true,
    });
  }, [activeRoomId]);

  useLayoutEffect(() => {
    measureIndicator();
  }, [measureIndicator, rooms.length]);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const ro = new ResizeObserver(() => measureIndicator());
    ro.observe(bar);
    window.addEventListener('resize', measureIndicator);
    const timer = window.setTimeout(measureIndicator, 120);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measureIndicator);
      window.clearTimeout(timer);
    };
  }, [measureIndicator]);

  return (
    <nav
      ref={barRef}
      aria-label="Room navigation"
      role="tablist"
      className={`tab-bar glass ${introRevealed ? '' : 'intro-hidden'}`}
    >
      <div
        aria-hidden="true"
        className="tab-indicator"
        style={{
          left: `${indicator.left}px`,
          width: `${indicator.width}px`,
          opacity: indicator.ready ? 1 : 0,
        }}
      />
      {rooms.map((room) => {
        const isActive = room.id === activeRoomId;
        return (
          <button
            key={room.id}
            ref={(el) => {
              btnRefs.current[room.id] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectRoom(room.id)}
            className={`tab-btn ${isActive ? 'active' : ''}`}
          >
            {renderTabIcon(room.tabIcon)}
            <span>{room.label}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onAddRoom}
        aria-label="Add room"
        title="Add room"
        className="tab-add-btn"
      >
        <PlusIcon className="w-[1.9rem] h-[1.9rem]" />
      </button>
    </nav>
  );
}
