import { useContext, useRef, useEffect, useState } from 'react';
import { SnapSectionContext } from './SnapSection';

const FadeContent = ({
  children,
  blur = false,
  duration = 800,
  delay = 0,
  threshold = 0.1,
  initialOpacity = 0,
  direction = 'up',
  distance = 20,
  once = true,
  className = '',
  ...props
}) => {
  const ref = useRef(null);
  const sectionActive = useContext(SnapSectionContext);
  const controlledBySection = sectionActive !== null;
  const [localVisible, setLocalVisible] = useState(false);
  const visible = controlledBySection ? sectionActive : localVisible;
  const transitionDelay = visible ? delay : 0;
  const offsets = {
    up: `translateY(${distance}px)`,
    down: `translateY(-${distance}px)`,
    left: `translateX(-${distance}px)`,
    right: `translateX(${distance}px)`,
  };

  useEffect(() => {
    if (controlledBySection) return undefined;

    const el = ref.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLocalVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setLocalVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [controlledBySection, once, threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : initialOpacity,
        filter: blur ? (visible ? 'blur(0px)' : 'blur(10px)') : undefined,
        transform: visible ? 'translate3d(0, 0, 0)' : offsets[direction] || offsets.up,
        transition: `opacity ${duration}ms ease-out ${transitionDelay}ms, filter ${duration}ms ease-out ${transitionDelay}ms, transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${transitionDelay}ms`,
        willChange: 'opacity, filter, transform',
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default FadeContent;
