import { useRef, useEffect, useState } from 'react';

const ScrollFloat = ({
  children,
  className = '',
  scrollContainerRef,
  animationDuration = 1,
  ease = 'ease-out',
  stagger = 0.03,
}) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, root: scrollContainerRef?.current || null }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [scrollContainerRef]);

  return (
    <span
      ref={ref}
      className={className}
      style={{
        display: 'inline-block',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity ${animationDuration}s ${ease}, transform ${animationDuration}s ${ease}`,
      }}
    >
      {children}
    </span>
  );
};

export default ScrollFloat;
