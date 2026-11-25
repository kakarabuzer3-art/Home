import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeBrightnessFillWidth,
  computeRoomDimOpacity,
  computeSunGlowOpacity,
  formatClockHms,
  formatTempDisplay,
  formatTrackTime,
  getDialStatus,
  pointerOffsetToDialValue,
  polarToCartesian,
  resolvePrevTrackAction,
  stepApplianceProgress,
  valueToProgress,
} from './havenLogic';

test('dial angle mapping covers 270deg top arc and clamps bottom gap', () => {
  // Top (12 o'clock) -> midpoint of 16..30 = 23
  assert.equal(pointerOffsetToDialValue(0, -100, 16, 30), 23);
  // Bottom-left (-135deg) -> min (16)
  assert.equal(pointerOffsetToDialValue(-100, 100, 16, 30), 16);
  // Bottom-right (+135deg) -> max (30)
  assert.equal(pointerOffsetToDialValue(100, 100, 16, 30), 30);
  // Oven range 50..250 at top -> 150
  assert.equal(pointerOffsetToDialValue(0, -80, 50, 250), 150);
  // Bottom deadzone slightly left clamps to min
  assert.equal(pointerOffsetToDialValue(-10, 100, 16, 30), 16);
  // Bottom deadzone slightly right clamps to max
  assert.equal(pointerOffsetToDialValue(10, 100, 16, 30), 30);
});

test('polarToCartesian maps 0deg to top and ±135deg to bottom corners', () => {
  const top = polarToCartesian(130, 130, 104, 0);
  assert.ok(Math.abs(top.x - 130) < 0.01);
  assert.ok(Math.abs(top.y - 26) < 0.01);

  const start = polarToCartesian(130, 130, 104, -135);
  assert.ok(start.x < 130 && start.y > 130);

  const end = polarToCartesian(130, 130, 104, 135);
  assert.ok(end.x > 130 && end.y > 130);
});

test('getDialStatus returns Heating, Cooling, Preheating, or Off', () => {
  assert.deepEqual(
    getDialStatus({ powerOn: false, value: 22, ambientTemp: 20.5 }),
    { kind: 'off', label: 'Off' },
  );
  assert.deepEqual(
    getDialStatus({ powerOn: true, value: 22, ambientTemp: 20.5 }),
    { kind: 'heating', label: 'Heating' },
  );
  assert.deepEqual(
    getDialStatus({ powerOn: true, value: 19, ambientTemp: 20.5 }),
    { kind: 'cooling', label: 'Cooling' },
  );
  assert.deepEqual(
    getDialStatus({ powerOn: true, value: 180, ambientTemp: 180, isOven: true }),
    { kind: 'preheating', label: 'Preheating' },
  );
});

test('room dim opacity and slider width follow spec formulas', () => {
  assert.equal(computeRoomDimOpacity(false, 72), 0.32);
  assert.equal(computeRoomDimOpacity(true, 100), 0);
  assert.equal(computeRoomDimOpacity(true, 72), Number(((28 / 100) * 0.28).toFixed(4)));
  assert.equal(computeBrightnessFillWidth(5), 18);
  assert.equal(computeBrightnessFillWidth(72), 72);
  assert.ok(computeSunGlowOpacity(true, 86) > computeSunGlowOpacity(false, 86));
});

test('time formatters and value progress behave deterministically', () => {
  assert.equal(formatTrackTime(72), '1:12');
  assert.equal(formatTrackTime(204), '3:24');
  assert.equal(formatClockHms(9 * 3600 + 41 * 60 + 7), '09:41:07');
  assert.equal(valueToProgress(23, 16, 30), 0.5);
  assert.equal(formatTempDisplay(22, 'C'), '22°');
  assert.equal(formatTempDisplay(20, 'F'), '68°');
});

test('prev track restarts if >5s in, else navigates to previous track', () => {
  assert.deepEqual(resolvePrevTrackAction(1, 12, 3), {
    nextIndex: 1,
    nextElapsedSec: 0,
    trackChanged: false,
  });
  assert.deepEqual(resolvePrevTrackAction(0, 3, 3), {
    nextIndex: 2,
    nextElapsedSec: 0,
    trackChanged: true,
  });
});

test('appliance progress increments by 2% and completes at 100%', () => {
  assert.deepEqual(stepApplianceProgress(0), { nextProgress: 2, completed: false });
  assert.deepEqual(stepApplianceProgress(98), { nextProgress: 100, completed: true });
});
