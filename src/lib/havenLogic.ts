import type { DialStatusKind } from '../data/havenData';

export const DIAL_START_DEG = -135;
export const DIAL_END_DEG = 135;
export const DIAL_SWEEP_DEG = 270;
export const DIAL_CENTER = 130;
export const DIAL_RADIUS = 104;
export const DIAL_ARC_LENGTH = 2 * Math.PI * DIAL_RADIUS * (DIAL_SWEEP_DEG / 360);

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

export function easeOutCubic(t: number): number {
  const clamped = clamp(t, 0, 1);
  return 1 - Math.pow(1 - clamped, 3);
}

/**
 * Converts a dial angle (degrees clockwise from 12 o'clock, -135 to +135)
 * into SVG cartesian coordinates.
 */
export function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDegFromTop: number,
): { x: number; y: number } {
  const rad = ((angleDegFromTop - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

/**
 * Builds an SVG arc path sweeping clockwise from startDeg to endDeg (0 = 12 o'clock).
 */
export function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startDeg: number,
  endDeg: number,
): string {
  const start = polarToCartesian(cx, cy, radius, startDeg);
  const end = polarToCartesian(cx, cy, radius, endDeg);
  const sweep = endDeg - startDeg;
  const largeArcFlag = sweep > 180 ? 1 : 0;
  return `M ${start.x.toFixed(3)} ${start.y.toFixed(3)} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`;
}

/**
 * Converts a normalized [0, 1] dial fraction into an angle in [-135, 135].
 */
export function progressToAngle(progress: number): number {
  return DIAL_START_DEG + clamp(progress, 0, 1) * DIAL_SWEEP_DEG;
}

/**
 * Converts a value in [min, max] to normalized progress [0, 1].
 */
export function valueToProgress(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

/**
 * Computes dial value from pointer offset (dx, dy) relative to the ring center.
 * Maps the 270-degree top arc (-135 to +135) cleanly, clamping the bottom 90-degree gap.
 */
export function pointerOffsetToDialValue(
  dx: number,
  dy: number,
  min: number,
  max: number,
): number {
  const degFromTop = (Math.atan2(dx, -dy) * 180) / Math.PI;
  const clampedDeg = clamp(degFromTop, DIAL_START_DEG, DIAL_END_DEG);
  const fraction = (clampedDeg - DIAL_START_DEG) / DIAL_SWEEP_DEG;
  return Math.round(min + fraction * (max - min));
}

/**
 * Determines the thermostat / oven status badge based on power, mode, and ambient temperature.
 */
export function getDialStatus(params: {
  powerOn: boolean;
  value: number;
  ambientTemp: number;
  isOven?: boolean;
}): { kind: DialStatusKind; label: string } {
  if (!params.powerOn) {
    return { kind: 'off', label: 'Off' };
  }
  if (params.isOven) {
    return { kind: 'preheating', label: 'Preheating' };
  }
  if (params.value >= params.ambientTemp) {
    return { kind: 'heating', label: 'Heating' };
  }
  return { kind: 'cooling', label: 'Cooling' };
}

/**
 * Computes the room dim overlay opacity from lights power and brightness (1..100).
 * Spec: (100 - brightness) / 100 * 0.28, or 0.32 when lights are off.
 */
export function computeRoomDimOpacity(lightsOn: boolean, brightness: number): number {
  if (!lightsOn) return 0.32;
  const b = clamp(brightness, 1, 100);
  return Number((((100 - b) / 100) * 0.28).toFixed(4));
}

/**
 * Computes visual width percentage for the brightness slider pill (minimum 18% visual).
 */
export function computeBrightnessFillWidth(brightness: number): number {
  return clamp(Math.max(18, brightness), 18, 100);
}

/**
 * Computes the room sun glow overlay opacity from lights power and brightness.
 */
export function computeSunGlowOpacity(lightsOn: boolean, brightness: number): number {
  if (!lightsOn) return 0.08;
  return Number((0.2 + (clamp(brightness, 1, 100) / 100) * 0.8).toFixed(3));
}

/**
 * Formats seconds as M:SS (e.g. 72 -> "1:12").
 */
export function formatTrackTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats a Date (or H/M/S) as HH:MM:SS for the live camera REC clock.
 */
export function formatClockHms(totalSeconds: number): string {
  const normalized = ((Math.floor(totalSeconds) % 86400) + 86400) % 86400;
  const h = Math.floor(normalized / 3600);
  const m = Math.floor((normalized % 3600) / 60);
  const s = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Handles prev-track behavior: restarts current track if > 5s in, else goes to previous track.
 */
export function resolvePrevTrackAction(
  currentIndex: number,
  elapsedSec: number,
  trackCount: number,
): { nextIndex: number; nextElapsedSec: number; trackChanged: boolean } {
  if (elapsedSec > 5) {
    return { nextIndex: currentIndex, nextElapsedSec: 0, trackChanged: false };
  }
  const prevIndex = (currentIndex - 1 + trackCount) % trackCount;
  return { nextIndex: prevIndex, nextElapsedSec: 0, trackChanged: true };
}

/**
 * Steps appliance progress by 2% per tick; auto-docks at 100%.
 */
export function stepApplianceProgress(progress: number): {
  nextProgress: number;
  completed: boolean;
} {
  const next = progress + 2;
  if (next >= 100) {
    return { nextProgress: 100, completed: true };
  }
  return { nextProgress: next, completed: false };
}

/**
 * Formats Celsius or Fahrenheit temperature display cleanly.
 */
export function formatTempDisplay(celsius: number, unit: 'C' | 'F'): string {
  if (unit === 'F') {
    return `${Math.round((celsius * 9) / 5 + 32)}°`;
  }
  return `${Math.round(celsius)}°`;
}
