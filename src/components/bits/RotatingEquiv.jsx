import React, { useState, useEffect } from 'react';

/**
 * Rotating display of official price equivalents.
 * Cycles through items with a fade up/down transition.
 *
 * @param {{ items: {label:string, equivDollars:number}[], text: (item) => string, className?: string, interval?: number }}
 */
export default function RotatingEquiv({ items, text, className = '', interval = 3000 }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % items.length);
        setVisible(true);
      }, 300);
    }, interval);
    return () => clearInterval(timer);
  }, [items.length, interval]);

  if (!items || items.length === 0) return null;

  return (
    <span
      className={`inline-block transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'} ${className}`}
    >
      {text(items[idx])}
    </span>
  );
}
