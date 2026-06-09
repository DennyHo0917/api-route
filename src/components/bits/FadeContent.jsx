import { useRef, useEffect, useState } from 'react';

const FadeContent = ({
  children,
  blur = false,
  duration = 800,
  delay = 0,
  threshold = 0.1,
  initialOpacity = 0,
  className = '',
  ...props
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
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : initialOpacity,
        filter: blur ? (visible ? 'blur(0px)' : 'blur(10px)') : undefined,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity ${duration}ms ease-out ${delay}ms, filter ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`,
        willChange: 'opacity, filter, transform',
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default FadeContent;
