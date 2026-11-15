import {isPlatformBrowser} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {
  DragFrame,
  DrawerState,
  SwipeDirection,
  TRANSITION_DURATION_MS,
  TRANSITION_EASING,
  computeDragFrame,
  computeStateFrame,
  detectSwipeDirection,
  isElementHorizontallyScrollable,
  isMobileDrawerViewport,
  resolveSnapState,
} from './drawer-state';
import {buildStandaloneHtml} from './standalone-html';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  private readonly sidebar = viewChild<ElementRef<HTMLElement>>('sidebar');
  private readonly sidebarInner =
    viewChild<ElementRef<HTMLElement>>('sidebarInner');
  private readonly sidebarShadow =
    viewChild<ElementRef<HTMLElement>>('sidebarShadow');
  private readonly overlay = viewChild<ElementRef<HTMLElement>>('overlay');
  private readonly envoltorio =
    viewChild<ElementRef<HTMLElement>>('envoltorio');
  private readonly fabBtn = viewChild<ElementRef<HTMLElement>>('fabBtn');

  readonly menuState = signal<DrawerState>(0);
  readonly isDragging = signal(false);
  readonly isClosing = signal(false);
  readonly scrollLocked = signal(false);
  readonly viewportWidth = signal(1440);

  readonly isMobile = computed(() =>
    isMobileDrawerViewport(this.viewportWidth()),
  );

  readonly isMenuInteractive = computed(
    () => !this.isMobile() || this.menuState() !== 0 || this.isClosing(),
  );

  readonly isMenuHiddenFromA11y = computed(
    () => this.isMobile() && this.menuState() === 0 && !this.isClosing(),
  );

  private tracking = false;
  private startState: DrawerState = 0;
  private startX = 0;
  private startY = 0;
  private currentX = 0;
  private dragStartDisplacementX: number | null = null;
  private direction: SwipeDirection = 'undecided';
  private lastFrame: DragFrame | null = null;
  private restTimer: ReturnType<typeof setTimeout> | null = null;

  private lastOverlayOpacity = '';
  private lastOverlayVisibility = '';
  private lastSidebarPointerEvents = '';
  private lastTransitionMode: 'none' | 'animate' | null = null;

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      const locked = this.isMobile() && this.scrollLocked();
      document.documentElement.classList.toggle('drawer-scroll-locked', locked);
      document.body.classList.toggle('drawer-scroll-locked', locked);
    });

    afterNextRender(() => {
      this.syncViewportWidth();

      const onResize = () => {
        this.syncViewportWidth();
      };

      const onTouchStart = (event: TouchEvent) => {
        this.handleTouchStart(event);
      };

      const onTouchMove = (event: TouchEvent) => {
        this.handleTouchMove(event);
      };

      const onTouchEnd = () => {
        this.handleTouchEndOrCancel();
      };

      const onTouchCancel = () => {
        this.handleTouchEndOrCancel();
      };

      window.addEventListener('resize', onResize, {passive: true});
      window.addEventListener('orientationchange', onResize, {passive: true});
      document.addEventListener('touchstart', onTouchStart, {passive: true});
      document.addEventListener('touchmove', onTouchMove, {passive: false});
      document.addEventListener('touchend', onTouchEnd, {passive: true});
      document.addEventListener('touchcancel', onTouchCancel, {passive: true});

      this.destroyRef.onDestroy(() => {
        this.clearRestTimer();
        window.removeEventListener('resize', onResize);
        window.removeEventListener('orientationchange', onResize);
        document.removeEventListener('touchstart', onTouchStart);
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        document.removeEventListener('touchcancel', onTouchCancel);
        document.documentElement.classList.remove('drawer-scroll-locked');
        document.body.classList.remove('drawer-scroll-locked');
      });
    });
  }

  toggleMenu(): void {
    if (!this.isMobile()) {
      return;
    }
    this.transitionToState(this.menuState() === 0 ? 1 : 0);
  }

  closeMenu(): void {
    if (!this.isMobile()) {
      return;
    }
    this.transitionToState(0);
  }

  onMenuItemClick(): void {
    if (this.isMobile()) {
      this.transitionToState(0);
    }
  }

  onWrapperTransitionEnd(event: TransitionEvent): void {
    if (
      event.target === event.currentTarget &&
      event.propertyName === 'transform' &&
      this.isMobile() &&
      !this.isDragging() &&
      !this.tracking
    ) {
      this.clearRestTimer();
      if (this.menuState() === 0) {
        this.resetWrapperToRest();
      } else {
        this.scrollLocked.set(true);
      }
    }
  }

  downloadStandaloneHtml(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const htmlContent = buildStandaloneHtml();
    const blob = new Blob([htmlContent], {type: 'text/html;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'index.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private transitionToState(nextState: DrawerState): void {
    if (!this.isMobile()) {
      this.applyDesktopModeToDom();
      return;
    }
    this.clearRestTimer();
    const wasOpen = this.menuState() !== 0;
    const wasMoved =
      wasOpen ||
      (this.lastFrame?.displacementX ?? 0) > 0 ||
      this.dragStartDisplacementX !== null;

    this.isDragging.set(false);
    this.menuState.set(nextState);

    const frame = computeStateFrame(nextState, this.viewportWidth());
    const animateBackToZero = nextState === 0 && wasMoved;
    this.isClosing.set(nextState === 0 && wasOpen);
    this.applyFrameToDom(frame, false, animateBackToZero, false);

    if (animateBackToZero) {
      this.restTimer = setTimeout(() => {
        if (
          this.isMobile() &&
          this.menuState() === 0 &&
          !this.isDragging() &&
          !this.tracking
        ) {
          this.resetWrapperToRest();
        }
      }, TRANSITION_DURATION_MS + 30);
    } else if (nextState === 0) {
      this.scrollLocked.set(false);
    } else {
      this.restTimer = setTimeout(() => {
        if (
          this.isMobile() &&
          this.menuState() !== 0 &&
          !this.isDragging() &&
          !this.tracking
        ) {
          this.scrollLocked.set(true);
        }
      }, TRANSITION_DURATION_MS + 30);
    }
  }

  private resetWrapperToRest(): void {
    this.isClosing.set(false);
    this.scrollLocked.set(false);
    const envoltorioEl = this.envoltorio()?.nativeElement;
    const fabEl = this.fabBtn()?.nativeElement;
    const sidebarEl = this.sidebar()?.nativeElement;
    const sidebarInnerEl = this.sidebarInner()?.nativeElement;
    const sidebarShadowEl = this.sidebarShadow()?.nativeElement;
    const overlayEl = this.overlay()?.nativeElement;
    if (envoltorioEl) {
      envoltorioEl.style.transition = 'none';
      envoltorioEl.style.transform = 'none';
    }
    if (fabEl) {
      fabEl.style.transition = 'none';
      fabEl.style.transform = 'none';
    }
    if (sidebarEl) {
      sidebarEl.style.transition = 'none';
    }
    if (sidebarInnerEl) {
      sidebarInnerEl.style.transition = 'none';
    }
    if (sidebarShadowEl) {
      sidebarShadowEl.style.transition = 'none';
    }
    if (overlayEl) {
      overlayEl.style.transition = 'none';
    }
    this.lastTransitionMode = 'none';
  }

  private clearStyleCaches(): void {
    this.lastOverlayOpacity = '';
    this.lastOverlayVisibility = '';
    this.lastSidebarPointerEvents = '';
    this.lastTransitionMode = null;
  }

  private applyDesktopModeToDom(): void {
    this.clearRestTimer();
    this.clearStyleCaches();
    this.isClosing.set(false);
    this.lastFrame = null;

    const sidebarEl = this.sidebar()?.nativeElement;
    const sidebarInnerEl = this.sidebarInner()?.nativeElement;
    const sidebarShadowEl = this.sidebarShadow()?.nativeElement;
    const overlayEl = this.overlay()?.nativeElement;
    const envoltorioEl = this.envoltorio()?.nativeElement;
    const fabEl = this.fabBtn()?.nativeElement;

    if (sidebarEl) {
      sidebarEl.style.transform = '';
      sidebarEl.style.transition = '';
      sidebarEl.style.pointerEvents = '';
    }
    if (sidebarInnerEl) {
      sidebarInnerEl.style.transform = '';
      sidebarInnerEl.style.transition = '';
    }
    if (sidebarShadowEl) {
      sidebarShadowEl.style.transform = '';
      sidebarShadowEl.style.opacity = '';
      sidebarShadowEl.style.transition = '';
    }
    if (envoltorioEl) {
      envoltorioEl.style.transform = '';
      envoltorioEl.style.transition = '';
    }
    if (fabEl) {
      fabEl.style.transform = '';
      fabEl.style.transition = '';
    }
    if (overlayEl) {
      overlayEl.style.opacity = '';
      overlayEl.style.visibility = '';
      overlayEl.style.pointerEvents = '';
      overlayEl.style.transition = '';
    }
  }

  private applyFrameToDom(
    frame: DragFrame,
    dragging: boolean,
    keepZeroTransform: boolean,
    immediate: boolean,
  ): void {
    this.lastFrame = frame;
    const sidebarEl = this.sidebar()?.nativeElement;
    const sidebarInnerEl = this.sidebarInner()?.nativeElement;
    const sidebarShadowEl = this.sidebarShadow()?.nativeElement;
    const overlayEl = this.overlay()?.nativeElement;
    const envoltorioEl = this.envoltorio()?.nativeElement;
    const fabEl = this.fabBtn()?.nativeElement;

    if (!sidebarEl || !sidebarInnerEl || !overlayEl || !envoltorioEl) {
      return;
    }

    const interactive = this.menuState() !== 0 || dragging;
    const progress = frame.overlayProgress;
    const transitionMode: 'none' | 'animate' =
      dragging || immediate || (this.menuState() === 0 && !keepZeroTransform)
        ? 'none'
        : 'animate';

    if (transitionMode !== this.lastTransitionMode) {
      this.lastTransitionMode = transitionMode;
      if (transitionMode === 'none') {
        envoltorioEl.style.transition = 'none';
        if (fabEl) fabEl.style.transition = 'none';
        sidebarEl.style.transition = 'none';
        sidebarInnerEl.style.transition = 'none';
        if (sidebarShadowEl) sidebarShadowEl.style.transition = 'none';
        overlayEl.style.transition = 'none';
      } else {
        const t = `${(TRANSITION_DURATION_MS / 1000).toFixed(2)}s ${TRANSITION_EASING}`;
        envoltorioEl.style.transition = `transform ${t}`;
        if (fabEl) fabEl.style.transition = `transform ${t}`;
        sidebarEl.style.transition = `transform ${t}`;
        sidebarInnerEl.style.transition = `transform ${t}`;
        if (sidebarShadowEl) {
          sidebarShadowEl.style.transition = `transform ${t}, opacity ${t}`;
        }
        overlayEl.style.transition = `opacity ${t}, visibility ${t}`;
      }
    }

    const wrapTransform =
      frame.displacementX === 0 && !dragging && !keepZeroTransform
        ? 'none'
        : `translateX(${frame.displacementX}px)`;
    envoltorioEl.style.transform = wrapTransform;
    if (fabEl) {
      fabEl.style.transform = wrapTransform;
    }

    sidebarEl.style.transform = `translateX(${frame.menuTranslateX}px)`;
    sidebarInnerEl.style.transform = `translateX(${frame.innerTranslateX}px)`;
    if (sidebarShadowEl) {
      sidebarShadowEl.style.transform = `translateX(${frame.displacementX}px)`;
    }

    const nextPointerEvents = interactive ? 'auto' : 'none';
    if (nextPointerEvents !== this.lastSidebarPointerEvents) {
      this.lastSidebarPointerEvents = nextPointerEvents;
      sidebarEl.style.pointerEvents = nextPointerEvents;
    }

    const nextOpacity = progress > 0 ? String(progress) : '0';
    if (nextOpacity !== this.lastOverlayOpacity) {
      this.lastOverlayOpacity = nextOpacity;
      overlayEl.style.opacity = nextOpacity;
      if (sidebarShadowEl) {
        sidebarShadowEl.style.opacity = nextOpacity;
      }
    }

    const nextVisibility = progress > 0 ? 'visible' : 'hidden';
    if (nextVisibility !== this.lastOverlayVisibility) {
      this.lastOverlayVisibility = nextVisibility;
      overlayEl.style.visibility = nextVisibility;
      overlayEl.style.pointerEvents = progress > 0 ? 'auto' : 'none';
    }
  }

  private clearRestTimer(): void {
    if (this.restTimer !== null) {
      clearTimeout(this.restTimer);
      this.restTimer = null;
    }
  }

  private readCurrentWrapperDisplacementX(): number {
    const envoltorioEl = this.envoltorio()?.nativeElement;
    if (!envoltorioEl) {
      return 0;
    }
    const transform = window.getComputedStyle(envoltorioEl).transform;
    if (!transform || transform === 'none') {
      return 0;
    }
    return new DOMMatrixReadOnly(transform).m41;
  }

  private syncViewportWidth(): void {
    const width = window.innerWidth;
    this.viewportWidth.set(width);
    if (!isMobileDrawerViewport(width)) {
      this.clearRestTimer();
      this.resetTouchTracking();
      this.isDragging.set(false);
      this.scrollLocked.set(false);
      this.menuState.set(0);
      this.applyDesktopModeToDom();
      return;
    }
    if (!this.isDragging()) {
      this.applyFrameToDom(
        computeStateFrame(this.menuState(), width),
        false,
        false,
        true,
      );
    }
  }

  private handleTouchStart(event: TouchEvent): void {
    if (!this.isMobile()) {
      return;
    }

    if (event.touches.length !== 1) {
      if (this.tracking) {
        this.finishActiveDrag();
      } else {
        this.resetTouchTracking();
      }
      return;
    }

    if (this.hasHorizontallyScrollableAncestor(event.target)) {
      this.resetTouchTracking();
      return;
    }

    this.clearRestTimer();
    const touch = event.touches[0];
    this.tracking = true;
    this.startState = this.menuState();
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.currentX = touch.clientX;
    this.direction = 'undecided';
    this.dragStartDisplacementX = null;

    if (this.lastTransitionMode === 'animate') {
      const visualX = this.readCurrentWrapperDisplacementX();
      const frozen = computeDragFrame(
        this.startState,
        0,
        this.viewportWidth(),
        undefined,
        visualX,
      );
      this.dragStartDisplacementX = frozen.displacementX;
      this.applyFrameToDom(frozen, true, false, true);
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (!this.tracking || !this.isMobile()) {
      return;
    }

    if (event.touches.length !== 1) {
      this.finishActiveDrag();
      return;
    }

    const touch = event.touches[0];
    const deltaX = touch.clientX - this.startX;
    const deltaY = touch.clientY - this.startY;

    if (this.direction === 'undecided') {
      const detected = detectSwipeDirection(deltaX, deltaY);
      if (detected === 'undecided') {
        return;
      }
      if (detected === 'vertical') {
        if (this.dragStartDisplacementX !== null) {
          this.transitionToState(this.menuState());
        }
        this.resetTouchTracking();
        return;
      }
      this.clearRestTimer();
      this.direction = 'horizontal';
      this.isDragging.set(true);
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    this.currentX = touch.clientX;
    const frame = computeDragFrame(
      this.startState,
      deltaX,
      this.viewportWidth(),
      undefined,
      this.dragStartDisplacementX ?? undefined,
    );
    this.applyFrameToDom(frame, true, false, false);
  }

  private handleTouchEndOrCancel(): void {
    if (!this.tracking) {
      return;
    }
    this.finishActiveDrag();
  }

  private finishActiveDrag(): void {
    if (this.direction === 'horizontal' && this.isDragging()) {
      const deltaX = this.currentX - this.startX;
      const frame = computeDragFrame(
        this.startState,
        deltaX,
        this.viewportWidth(),
        undefined,
        this.dragStartDisplacementX ?? undefined,
      );
      const nextState = resolveSnapState({
        startState: this.startState,
        displacementX: frame.displacementX,
        deltaX,
        currentX: this.currentX,
        viewportWidth: this.viewportWidth(),
      });

      this.transitionToState(nextState);
    } else {
      this.isDragging.set(false);
      if (this.dragStartDisplacementX !== null) {
        this.transitionToState(this.menuState());
      }
    }

    this.resetTouchTracking();
  }

  private resetTouchTracking(): void {
    this.tracking = false;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.dragStartDisplacementX = null;
    this.direction = 'undecided';
  }

  private hasHorizontallyScrollableAncestor(
    target: EventTarget | null,
  ): boolean {
    let node = target instanceof HTMLElement ? target : null;
    while (node && node !== document.body && node !== document.documentElement) {
      const computedStyle = window.getComputedStyle(node);
      if (
        isElementHorizontallyScrollable({
          scrollWidth: node.scrollWidth,
          clientWidth: node.clientWidth,
          overflowX: computedStyle.overflowX,
        })
      ) {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  }
}
