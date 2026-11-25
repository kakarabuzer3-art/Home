import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RoomConfig } from '../data/havenData';
import {
  DIAL_ARC_LENGTH,
  DIAL_CENTER,
  DIAL_END_DEG,
  DIAL_RADIUS,
  DIAL_START_DEG,
  describeArc,
  easeOutCubic,
  formatTempDisplay,
  getDialStatus,
  pointerOffsetToDialValue,
  polarToCartesian,
  progressToAngle,
  valueToProgress,
} from '../lib/havenLogic';
import { GearIcon, PowerIcon } from './Icons';

interface ThermostatCardProps {
  room: RoomConfig;
  targetValue: number;
  powerOn: boolean;
  tempUnit: 'C' | 'F';
  onChangeValue: (val: number) => void;
  onCommitValue: (val: number) => void;
  onTogglePower: () => void;
  onOpenSettings: () => void;
  introHidden: boolean;
  spotlight: boolean;
  animSeed: number;
}

const TICK_INDICES = Array.from({ length: 31 }, (_, i) => i);

export function ThermostatCard({
  room,
  targetValue,
  powerOn,
  tempUnit,
  onChangeValue,
  onCommitValue,
  onTogglePower,
  onOpenSettings,
  introHidden,
  spotlight,
  animSeed,
}: ThermostatCardProps) {
  const [displayValue, setDisplayValue] = useState<number>(targetValue);
  const displayRef = useRef<number>(targetValue);
  const draggingRef = useRef<boolean>(false);
  const latestDragValRef = useRef<number>(targetValue);
  const dialStageRef = useRef<HTMLDivElement | null>(null);

  // Animate displayValue with 700ms ease-out whenever targetValue changes programmatically
  useEffect(() => {
    if (draggingRef.current) {
      displayRef.current = targetValue;
      setDisplayValue(targetValue);
      return;
    }

    const from = displayRef.current;
    const to = targetValue;
    if (Math.abs(from - to) < 0.001) {
      setDisplayValue(to);
      return;
    }

    let rafId = 0;
    const duration = 700;
    const startTime = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const current = from + (to - from) * easeOutCubic(t);
      displayRef.current = current;
      setDisplayValue(current);
      if (t < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        displayRef.current = to;
        setDisplayValue(to);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [targetValue, room.id, animSeed]);

  const progress = valueToProgress(displayValue, room.dialMin, room.dialMax);
  const roundedDisplay = Math.round(displayValue);
  const status = getDialStatus({
    powerOn,
    value: roundedDisplay,
    ambientTemp: room.ambientTemp,
    isOven: room.isOven,
  });

  const fullArcPath = useMemo(
    () => describeArc(DIAL_CENTER, DIAL_CENTER, DIAL_RADIUS, DIAL_START_DEG, DIAL_END_DEG),
    [],
  );

  const knobPos = useMemo(() => {
    const angle = progressToAngle(progress);
    return polarToCartesian(DIAL_CENTER, DIAL_CENTER, DIAL_RADIUS, angle);
  }, [progress]);

  const ticks = useMemo(
    () =>
      TICK_INDICES.map((i) => {
        const frac = i / 30;
        const angle = progressToAngle(frac);
        const isMajor = i % 5 === 0;
        const pOuter = polarToCartesian(DIAL_CENTER, DIAL_CENTER, 83, angle);
        const pInner = polarToCartesian(DIAL_CENTER, DIAL_CENTER, isMajor ? 72 : 77, angle);
        return { i, frac, isMajor, x1: pInner.x, y1: pInner.y, x2: pOuter.x, y2: pOuter.y };
      }),
    [],
  );

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = dialStageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nextVal = pointerOffsetToDialValue(
        clientX - cx,
        clientY - cy,
        room.dialMin,
        room.dialMax,
      );
      latestDragValRef.current = nextVal;
      displayRef.current = nextVal;
      setDisplayValue(nextVal);
      onChangeValue(nextVal);
    },
    [room.dialMin, room.dialMax, onChangeValue],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Do not hijack clicks on the center power button
    if ((e.target as HTMLElement).closest('button')) return;
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    onCommitValue(latestDragValRef.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = room.isOven ? 5 : 1;
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      next = Math.min(room.dialMax, Math.round(targetValue) + step);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      next = Math.max(room.dialMin, Math.round(targetValue) - step);
    }
    if (next !== null) {
      e.preventDefault();
      onChangeValue(next);
      onCommitValue(next);
    }
  };

  const strokeOffset = DIAL_ARC_LENGTH * (1 - progress);
  const formattedTemp = formatTempDisplay(roundedDisplay, tempUnit);

  return (
    <section
      aria-label={`${room.dialTitle} control`}
      className={`inner-card card-thermostat ${introHidden ? 'card-intro-hidden' : ''} ${spotlight ? 'card-spotlight' : ''}`}
      style={{ transitionDelay: introHidden ? '0ms' : '90ms' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-[1.2rem]">
        <div className="flex flex-col gap-[0.8rem]">
          <h2 className="m-0 text-[2.6rem] font-semibold leading-[1.15] tracking-[-0.025em] text-white tabular-nums">
            <span className="roll-text-wrap">
              <span key={room.id} className="roll-text-inner">
                {room.dialTitle} · {formattedTemp}
              </span>
            </span>
          </h2>
          <div className="status-chip" data-testid="thermostat-status">
            <span className={`status-dot ${status.kind}`} aria-hidden="true" />
            <span>{status.label}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={`${room.dialTitle} settings`}
          title="Climate preferences"
          className="thermo-gear"
        >
          <GearIcon className="w-[1.9rem] h-[1.9rem]" />
        </button>
      </div>

      {/* SVG 270deg Dial */}
      <div
        ref={dialStageRef}
        role="slider"
        tabIndex={0}
        aria-label={`${room.dialTitle} temperature dial`}
        aria-valuemin={room.dialMin}
        aria-valuemax={room.dialMax}
        aria-valuenow={roundedDisplay}
        aria-valuetext={`${formattedTemp} ${status.label}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="dial-stage"
      >
        <svg
          viewBox="0 0 260 260"
          className={`dial-svg ${powerOn ? '' : 'dial-off'}`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="havenDialGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3cc4b4" />
              <stop offset="52%" stopColor="#8ef0d6" />
              <stop offset="100%" stopColor="#e3fbb0" />
            </linearGradient>
            <filter id="havenDialGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
            </filter>
          </defs>

          {/* Dark track */}
          <path
            d={fullArcPath}
            fill="none"
            stroke="rgba(40, 42, 38, 0.45)"
            strokeWidth="22"
            strokeLinecap="round"
          />

          {/* Blurred mint-teal-lime glow copy */}
          <path
            d={fullArcPath}
            fill="none"
            stroke="url(#havenDialGrad)"
            strokeWidth="22"
            strokeLinecap="round"
            strokeDasharray={DIAL_ARC_LENGTH}
            strokeDashoffset={strokeOffset}
            filter="url(#havenDialGlow)"
            opacity={powerOn ? 0.65 : 0}
          />

          {/* Crisp value arc */}
          <path
            d={fullArcPath}
            fill="none"
            stroke="url(#havenDialGrad)"
            strokeWidth="22"
            strokeLinecap="round"
            strokeDasharray={DIAL_ARC_LENGTH}
            strokeDashoffset={strokeOffset}
          />

          {/* 31 inner tick marks */}
          {ticks.map((tick) => {
            const lit = powerOn && tick.frac <= progress + 0.008;
            return (
              <line
                key={tick.i}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke={lit ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.22)'}
                strokeWidth={tick.isMajor ? 2.2 : 1.4}
                strokeLinecap="round"
              />
            );
          })}

          {/* White knob at arc end */}
          <circle
            cx={knobPos.x}
            cy={knobPos.y}
            r="11.5"
            fill="#ffffff"
            style={{
              filter: 'drop-shadow(0 3px 8px rgba(10, 20, 16, 0.42))',
            }}
          />
          <circle
            cx={knobPos.x}
            cy={knobPos.y}
            r="4.2"
            fill={powerOn ? '#3cc4b4' : 'rgba(110,115,110,0.5)'}
          />
        </svg>

        {/* Center 6.4rem dark power button */}
        <button
          type="button"
          onClick={onTogglePower}
          aria-label={powerOn ? `Turn off ${room.dialTitle}` : `Turn on ${room.dialTitle}`}
          aria-pressed={powerOn}
          className={`dial-power-btn ${powerOn ? 'on' : ''}`}
        >
          <PowerIcon className="w-[2.5rem] h-[2.5rem]" />
        </button>
      </div>

      {/* Bottom readout */}
      <div className="text-center -mt-[1.4rem]">
        <div
          data-testid="thermostat-readout"
          className="text-[4.6rem] font-semibold leading-none tracking-[-0.03em] text-white tabular-nums"
        >
          {formattedTemp}
        </div>
        <div className="text-[1.35rem] font-medium text-[var(--muted)] mt-[0.55rem]">
          {room.dialSubtitle}
        </div>
      </div>
    </section>
  );
}
