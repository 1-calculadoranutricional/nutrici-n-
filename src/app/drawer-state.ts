export type DrawerState = 0 | 1 | 2;

export type SwipeDirection = 'undecided' | 'horizontal' | 'vertical';

export interface DragFrame {
  displacementX: number;
  menuTranslateX: number;
  innerTranslateX: number;
  menuWidth: number;
  overlayProgress: number;
  phase: 'slide' | 'resize';
}

export interface SnapParams {
  startState: DrawerState;
  displacementX: number;
  deltaX: number;
  currentX: number;
  viewportWidth: number;
  partialWidth?: number;
  sensitivity?: number;
}

export interface HorizontalScrollMetrics {
  scrollWidth: number;
  clientWidth: number;
  overflowX: string;
}

export const DRAWER_PARTIAL_WIDTH = 290;
export const DRAG_SENSITIVITY = 50;
export const TRANSITION_DURATION_MS = 250;
export const TRANSITION_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const DESKTOP_BREAKPOINT = 768;
export const DIRECTION_LOCK_THRESHOLD = 4;

export function isMobileDrawerViewport(viewportWidth: number): boolean {
  return viewportWidth < DESKTOP_BREAKPOINT;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getEffectivePartialWidth(
  viewportWidth: number,
  partialWidth = DRAWER_PARTIAL_WIDTH,
): number {
  if (viewportWidth <= 0) return partialWidth;
  return Math.min(partialWidth, viewportWidth);
}

export function detectSwipeDirection(
  deltaX: number,
  deltaY: number,
  threshold = DIRECTION_LOCK_THRESHOLD,
): SwipeDirection {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  if (absX >= 2 && absX > absY * 1.5) {
    return 'horizontal';
  }
  if (Math.max(absX, absY) < threshold) {
    return 'undecided';
  }
  return absY > absX ? 'vertical' : 'horizontal';
}

function buildFrame(
  displacementX: number,
  effectivePartial: number,
  fullWidth: number,
  phase: 'slide' | 'resize',
): DragFrame {
  const overlayProgress =
    effectivePartial > 0 ? clamp(displacementX / effectivePartial, 0, 1) : 0;

  return {
    displacementX,
    menuTranslateX: displacementX - fullWidth,
    innerTranslateX: fullWidth - Math.max(effectivePartial, displacementX),
    menuWidth: fullWidth,
    overlayProgress,
    phase,
  };
}

export function computeStateFrame(
  state: DrawerState,
  viewportWidth: number,
  partialWidth = DRAWER_PARTIAL_WIDTH,
): DragFrame {
  const effectivePartial = getEffectivePartialWidth(viewportWidth, partialWidth);
  const fullWidth = Math.max(effectivePartial, viewportWidth);

  if (state === 0) {
    return buildFrame(0, effectivePartial, fullWidth, 'slide');
  }

  if (state === 1) {
    return buildFrame(effectivePartial, effectivePartial, fullWidth, 'slide');
  }

  return buildFrame(fullWidth, effectivePartial, fullWidth, 'resize');
}

export function computeDragFrame(
  startState: DrawerState,
  deltaX: number,
  viewportWidth: number,
  partialWidth = DRAWER_PARTIAL_WIDTH,
  startDisplacementX?: number,
): DragFrame {
  const effectivePartial = getEffectivePartialWidth(viewportWidth, partialWidth);
  const fullWidth = Math.max(effectivePartial, viewportWidth);
  const defaultBase =
    startState === 0 ? 0 : startState === 1 ? effectivePartial : fullWidth;
  const base = startDisplacementX ?? defaultBase;
  const raw = base + deltaX;

  if (startState === 0 || (startState === 1 && raw < effectivePartial)) {
    const displacementX = clamp(raw, 0, effectivePartial);
    return buildFrame(displacementX, effectivePartial, fullWidth, 'slide');
  }

  const displacementX = clamp(raw, effectivePartial, fullWidth);
  return buildFrame(displacementX, effectivePartial, fullWidth, 'resize');
}

export function resolveSnapState(params: SnapParams): DrawerState {
  const {
    startState,
    displacementX,
    deltaX,
    currentX,
    viewportWidth,
    partialWidth = DRAWER_PARTIAL_WIDTH,
    sensitivity = DRAG_SENSITIVITY,
  } = params;

  const effectivePartial = getEffectivePartialWidth(viewportWidth, partialWidth);
  const fullWidth = Math.max(effectivePartial, viewportWidth);

  if ((startState === 1 || startState === 2) && displacementX >= effectivePartial) {
    const midpoint = (fullWidth + effectivePartial) / 2;
    return displacementX >= midpoint ? 2 : 1;
  }

  if (startState === 1 && displacementX < effectivePartial) {
    return deltaX < -sensitivity ? 0 : 1;
  }

  if (startState === 0) {
    return deltaX > sensitivity && currentX > sensitivity ? 1 : 0;
  }

  return startState;
}

export function isElementHorizontallyScrollable(metrics: HorizontalScrollMetrics): boolean {
  const allowsHorizontalOverflow =
    metrics.overflowX === 'auto' || metrics.overflowX === 'scroll';
  return allowsHorizontalOverflow && metrics.scrollWidth > metrics.clientWidth + 1;
}
