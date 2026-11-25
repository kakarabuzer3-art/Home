import { useCallback, useRef, useState } from 'react';
import { clamp, computeBrightnessFillWidth } from '../lib/havenLogic';
import { SunIcon } from './Icons';

interface BrightnessSliderProps {
  brightness: number;
  disabled: boolean;
  onChangeBrightness: (value: number) => void;
  onDragStateChange: (dragging: boolean) => void;
  introHidden: boolean;
  spotlight: boolean;
}

export function BrightnessSlider({
  brightness,
  disabled,
  onChangeBrightness,
  onDragStateChange,
  introHidden,
  spotlight,
}: BrightnessSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0.01, 1);
      onChangeBrightness(Math.round(ratio * 100));
    },
    [onChangeBrightness],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    setDragging(true);
    onDragStateChange(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || disabled) return;
    updateFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    onDragStateChange(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChangeBrightness(clamp(Math.round(brightness) + 5, 1, 100));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChangeBrightness(clamp(Math.round(brightness) - 5, 1, 100));
    }
  };

  const rounded = Math.round(brightness);
  const fillWidth = computeBrightnessFillWidth(rounded);
  const sunRotation = dragging ? rounded * 2.4 : rounded * 0.9;

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label="Room lighting brightness"
      aria-valuemin={1}
      aria-valuemax={100}
      aria-valuenow={rounded}
      aria-valuetext={`${rounded}%`}
      aria-disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      className={`inner-card card-brightness ${disabled ? 'slider-disabled' : ''} ${introHidden ? 'card-intro-hidden' : ''} ${spotlight ? 'card-spotlight' : ''}`}
      style={{ transitionDelay: introHidden ? '0ms' : '330ms' }}
    >
      {/* Mint gradient fill */}
      <div
        aria-hidden="true"
        className={`brightness-fill ${dragging ? 'dragging' : ''}`}
        style={{ width: `${fillWidth}%` }}
      />

      {/* Foreground icon and readout */}
      <div className="relative z-10 w-full h-full px-[2rem] flex items-center justify-between pointer-events-none">
        <div
          className="w-[3.2rem] h-[3.2rem] rounded-full flex items-center justify-center"
          style={{
            color: '#103731',
            transform: `rotate(${sunRotation}deg)`,
            transition: dragging ? 'transform 0.05s linear' : 'transform 0.45s var(--out)',
          }}
        >
          <SunIcon className="w-[2.2rem] h-[2.2rem]" />
        </div>

        <span
          data-testid="brightness-value"
          className="text-[1.6rem] font-bold tabular-nums transition-colors duration-200"
          style={{
            color: fillWidth >= 92 && !disabled ? '#103731' : '#ffffff',
            textShadow: fillWidth >= 92 && !disabled ? 'none' : '0 1px 6px rgba(14, 24, 20, 0.45)',
          }}
        >
          {rounded}%
        </span>
      </div>
    </div>
  );
}
