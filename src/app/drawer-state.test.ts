import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDragFrame,
  computeStateFrame,
  detectSwipeDirection,
  isElementHorizontallyScrollable,
  isMobileDrawerViewport,
  resolveSnapState,
} from './drawer-state';

const VIEWPORT = 390;

test('isMobileDrawerViewport enables 3-state drawer below 768px and disables at 768px+', () => {
  assert.equal(isMobileDrawerViewport(390), true);
  assert.equal(isMobileDrawerViewport(767), true);
  assert.equal(isMobileDrawerViewport(768), false);
  assert.equal(isMobileDrawerViewport(1440), false);
});

test('detectSwipeDirection locks clean horizontal drags immediately at 2px while tolerating micro-jitter', () => {
  assert.equal(detectSwipeDirection(0, 0), 'undecided');
  assert.equal(detectSwipeDirection(1, 2), 'undecided');
  assert.equal(detectSwipeDirection(3, -3), 'undecided');
  assert.equal(detectSwipeDirection(2, 0), 'horizontal');
  assert.equal(detectSwipeDirection(3, 1), 'horizontal');
  assert.equal(detectSwipeDirection(3, 12), 'vertical');
  assert.equal(detectSwipeDirection(15, 4), 'horizontal');
  assert.equal(detectSwipeDirection(-10, 10), 'horizontal');
});

test('computeDragFrame continues smoothly from mid-transition startDisplacementX without snapping back', () => {
  const resumed = computeDragFrame(0, 25, VIEWPORT, undefined, 40);
  assert.equal(resumed.phase, 'slide');
  assert.equal(resumed.displacementX, 65);
  assert.equal(resumed.menuTranslateX, 65 - VIEWPORT);
});

test('computeStateFrame returns GPU-composited two-layer transforms for states 0, 1, and 2', () => {
  assert.deepEqual(computeStateFrame(0, VIEWPORT), {
    displacementX: 0,
    menuTranslateX: -390,
    innerTranslateX: 100,
    menuWidth: 390,
    overlayProgress: 0,
    phase: 'slide',
  });

  assert.deepEqual(computeStateFrame(1, VIEWPORT), {
    displacementX: 290,
    menuTranslateX: -100,
    innerTranslateX: 100,
    menuWidth: 390,
    overlayProgress: 1,
    phase: 'slide',
  });

  assert.deepEqual(computeStateFrame(2, VIEWPORT), {
    displacementX: 390,
    menuTranslateX: 0,
    innerTranslateX: 0,
    menuWidth: 390,
    overlayProgress: 1,
    phase: 'resize',
  });
});

test('Phase 1 drag from state 0 slides inner content smoothly without width reflow', () => {
  const mid = computeDragFrame(0, 145, VIEWPORT);
  assert.equal(mid.phase, 'slide');
  assert.equal(mid.displacementX, 145);
  assert.equal(mid.menuTranslateX, -245);
  assert.equal(mid.innerTranslateX, 100);
  // Screen X of inner content = menuTranslateX + innerTranslateX = -145
  assert.equal(mid.menuTranslateX + mid.innerTranslateX, -145);
  assert.equal(mid.menuWidth, 390);
  assert.equal(mid.overlayProgress, 0.5);

  const clampedMax = computeDragFrame(0, 500, VIEWPORT);
  assert.equal(clampedMax.displacementX, 290);
  assert.equal(clampedMax.menuTranslateX + clampedMax.innerTranslateX, 0);
  assert.equal(clampedMax.overlayProgress, 1);

  const clampedMin = computeDragFrame(0, -40, VIEWPORT);
  assert.equal(clampedMin.displacementX, 0);
  assert.equal(clampedMin.menuTranslateX + clampedMin.innerTranslateX, -290);
  assert.equal(clampedMin.overlayProgress, 0);
});

test('Phase 1 drag left from state 1 slides back toward 0', () => {
  const frame = computeDragFrame(1, -100, VIEWPORT);
  assert.equal(frame.phase, 'slide');
  assert.equal(frame.displacementX, 190);
  assert.equal(frame.menuTranslateX, -200);
  assert.equal(frame.innerTranslateX, 100);
  assert.equal(frame.menuTranslateX + frame.innerTranslateX, -100);
  assert.ok(Math.abs(frame.overlayProgress - 190 / 290) < 1e-6);
});

test('Phase 2 drag right from state 1 keeps inner items pinned at screen X=0 while expanding drawer right edge without changing width', () => {
  const frame = computeDragFrame(1, 50, VIEWPORT);
  assert.equal(frame.phase, 'resize');
  assert.equal(frame.displacementX, 340);
  assert.equal(frame.menuTranslateX, -50);
  assert.equal(frame.innerTranslateX, 50);
  assert.equal(frame.menuTranslateX + frame.innerTranslateX, 0);
  assert.equal(frame.menuWidth, 390);
  assert.equal(frame.overlayProgress, 1);

  const overMax = computeDragFrame(1, 300, VIEWPORT);
  assert.equal(overMax.displacementX, 390);
  assert.equal(overMax.menuTranslateX, 0);
  assert.equal(overMax.innerTranslateX, 0);
});

test('Phase 2 drag left from state 2 stops cleanly at 290px minimum and never jumps to 0', () => {
  const partial = computeDragFrame(2, -40, VIEWPORT);
  assert.equal(partial.phase, 'resize');
  assert.equal(partial.displacementX, 350);
  assert.equal(partial.menuTranslateX, -40);
  assert.equal(partial.innerTranslateX, 40);
  assert.equal(partial.menuTranslateX + partial.innerTranslateX, 0);

  const clampedToPartial = computeDragFrame(2, -300, VIEWPORT);
  assert.equal(clampedToPartial.phase, 'resize');
  assert.equal(clampedToPartial.displacementX, 290);
  assert.equal(clampedToPartial.menuTranslateX, -100);
  assert.equal(clampedToPartial.innerTranslateX, 100);
  assert.equal(clampedToPartial.menuTranslateX + clampedToPartial.innerTranslateX, 0);
  assert.equal(clampedToPartial.overlayProgress, 1);
});

test('resolveSnapState enforces both delta > 50 and currentX > 50 when opening from 0', () => {
  assert.equal(
    resolveSnapState({
      startState: 0,
      displacementX: 40,
      deltaX: 40,
      currentX: 80,
      viewportWidth: VIEWPORT,
    }),
    0,
  );

  assert.equal(
    resolveSnapState({
      startState: 0,
      displacementX: 50,
      deltaX: 50,
      currentX: 70,
      viewportWidth: VIEWPORT,
    }),
    0,
  );

  assert.equal(
    resolveSnapState({
      startState: 0,
      displacementX: 55,
      deltaX: 55,
      currentX: 50,
      viewportWidth: VIEWPORT,
    }),
    0,
  );

  assert.equal(
    resolveSnapState({
      startState: 0,
      displacementX: 55,
      deltaX: 55,
      currentX: 60,
      viewportWidth: VIEWPORT,
    }),
    1,
  );
});

test('resolveSnapState enforces -50px threshold when closing from state 1', () => {
  assert.equal(
    resolveSnapState({
      startState: 1,
      displacementX: 250,
      deltaX: -40,
      currentX: 160,
      viewportWidth: VIEWPORT,
    }),
    1,
  );

  assert.equal(
    resolveSnapState({
      startState: 1,
      displacementX: 230,
      deltaX: -60,
      currentX: 140,
      viewportWidth: VIEWPORT,
    }),
    0,
  );
});

test('resolveSnapState uses exact midpoint (viewportWidth + 290) / 2 between states 1 and 2', () => {
  assert.equal(
    resolveSnapState({
      startState: 1,
      displacementX: 339,
      deltaX: 49,
      currentX: 200,
      viewportWidth: VIEWPORT,
    }),
    1,
  );

  assert.equal(
    resolveSnapState({
      startState: 1,
      displacementX: 340,
      deltaX: 50,
      currentX: 200,
      viewportWidth: VIEWPORT,
    }),
    2,
  );

  assert.equal(
    resolveSnapState({
      startState: 2,
      displacementX: 290,
      deltaX: -200,
      currentX: 50,
      viewportWidth: VIEWPORT,
    }),
    1,
  );

  assert.equal(
    resolveSnapState({
      startState: 2,
      displacementX: 345,
      deltaX: -45,
      currentX: 300,
      viewportWidth: VIEWPORT,
    }),
    2,
  );
});

test('isElementHorizontallyScrollable detects genuine horizontal scroll containers', () => {
  assert.equal(
    isElementHorizontallyScrollable({
      scrollWidth: 600,
      clientWidth: 300,
      overflowX: 'auto',
    }),
    true,
  );
  assert.equal(
    isElementHorizontallyScrollable({
      scrollWidth: 600,
      clientWidth: 300,
      overflowX: 'scroll',
    }),
    true,
  );
  assert.equal(
    isElementHorizontallyScrollable({
      scrollWidth: 600,
      clientWidth: 300,
      overflowX: 'hidden',
    }),
    false,
  );
  assert.equal(
    isElementHorizontallyScrollable({
      scrollWidth: 300,
      clientWidth: 300,
      overflowX: 'auto',
    }),
    false,
  );
});
