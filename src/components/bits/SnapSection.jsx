import { Children, cloneElement, createContext, useEffect, useRef, useState } from 'react';

export const SnapSectionContext = createContext(null);

export default function SnapSection({
  children,
  className = '',
  contentClassName = '',
  activeOverride = null,
  deckHeight = null,
  threshold = 0.48,
}) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);
  const isDeckControlled = activeOverride !== null;
  const isActive = isDeckControlled ? activeOverride : active;

  useEffect(() => {
    if (isDeckControlled) return undefined;

    const el = ref.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.intersectionRatio >= threshold),
      { threshold: [0, threshold, 0.75] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isDeckControlled, threshold]);

  return (
    <section
      ref={ref}
      data-snap-section="true"
      className={`flex min-h-[calc(100vh-72px)] snap-start snap-always items-center ${className}`}
      style={deckHeight ? { height: deckHeight } : undefined}
    >
      <SnapSectionContext.Provider value={isActive}>
        <div
          className={contentClassName}
          style={{
            opacity: isActive ? 1 : 0,
            transition: 'opacity 520ms ease-out',
            willChange: 'opacity',
          }}
        >
          {children}
        </div>
      </SnapSectionContext.Provider>
    </section>
  );
}

export function SnapDeck({ children, className = '' }) {
  const ref = useRef(null);
  const wheelLock = useRef(false);
  const touchStartY = useRef(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [height, setHeight] = useState(0);
  const allChildren = Children.toArray(children);
  const slides = allChildren.filter((child) => child?.type === SnapSection);
  const overlays = allChildren.filter((child) => child?.type !== SnapSection);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const updateHeight = () => setHeight(el.clientHeight);
    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('api-route:snap-deck-state', {
      detail: {
        activeIndex,
        total: slides.length,
        atEnd: activeIndex === slides.length - 1,
      },
    }));
  }, [activeIndex, slides.length]);

  const goTo = (next) => {
    activeIndexRef.current = next;
    setActiveIndex(next);
  };

  const getNextIndex = (direction) => (
    Math.max(0, Math.min(slides.length - 1, activeIndexRef.current + direction))
  );

  const go = (direction) => {
    const next = getNextIndex(direction);
    if (next === activeIndexRef.current) return false;

    goTo(next);
    return true;
  };

  const onWheel = (event) => {
    if (event.target.closest?.('.modal-overlay')) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || Math.abs(event.deltaY) < 10) return;

    event.preventDefault();
    if (wheelLock.current) return;

    const direction = Math.sign(event.deltaY);
    const next = getNextIndex(direction);
    if (next === activeIndexRef.current) return;

    wheelLock.current = true;
    goTo(next);
    window.setTimeout(() => {
      wheelLock.current = false;
    }, 920);
  };

  const onTouchStart = (event) => {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const onTouchEnd = (event) => {
    if (touchStartY.current === null) return;
    const delta = touchStartY.current - (event.changedTouches[0]?.clientY ?? touchStartY.current);
    touchStartY.current = null;
    if (Math.abs(delta) > 42) go(Math.sign(delta));
  };

  const onClick = (event) => {
    const link = event.target.closest?.('a[href^="#"]');
    if (!link) return;

    const id = link.getAttribute('href')?.slice(1);
    const target = id ? document.getElementById(id) : null;
    const section = target?.closest?.('[data-snap-section="true"]');
    if (!section || !ref.current?.contains(section)) return;

    const next = Array.from(ref.current.querySelectorAll('[data-snap-section="true"]')).indexOf(section);
    if (next < 0) return;

    event.preventDefault();
    goTo(next);
    window.history.replaceState(null, '', `#${id}`);
  };

  return (
    <div
      ref={ref}
      className={`h-[calc(100vh-72px)] overflow-hidden ${className}`}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={onClick}
    >
      <div
        style={{
          transform: `translate3d(0, -${activeIndex * height}px, 0)`,
          transition: 'transform 1080ms cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform',
        }}
      >
        {slides.map((child, index) => cloneElement(child, {
          activeOverride: index === activeIndex,
          deckHeight: height || undefined,
        }))}
      </div>
      {overlays}
    </div>
  );
}
