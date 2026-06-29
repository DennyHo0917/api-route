import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const pad = (n) => String(n).padStart(2, '0');

const parseLocalDateTime = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value || '');
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  const date = new Date(year, month - 1, day, hour, minute);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toLocalDateTime = (date) => (
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
);

const sameDay = (a, b) => (
  a && b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()
);

const addMonths = (date, count) => new Date(date.getFullYear(), date.getMonth() + count, 1);

export default function DateTimePicker({ value, onChange, placeholder, ariaLabel }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language || 'en';
  const selected = parseLocalDateTime(value);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(selected || new Date());
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const weekStartsOn = locale.startsWith('en') ? 0 : 1;
  const weekdays = useMemo(() => (
    Array.from({ length: 7 }, (_, index) => {
      const day = (weekStartsOn + index) % 7;
      return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2026, 5, 7 + day));
    })
  ), [locale, weekStartsOn]);

  const days = useMemo(() => {
    const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const offset = (first.getDay() - weekStartsOn + 7) % 7;
    return Array.from({ length: 42 }, (_, index) => (
      new Date(viewDate.getFullYear(), viewDate.getMonth(), index - offset + 1)
    ));
  }, [viewDate, weekStartsOn]);

  const displayValue = selected
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(selected)
    : placeholder;

  const updateDate = (next) => {
    const base = selected || new Date();
    next.setHours(base.getHours(), base.getMinutes(), 0, 0);
    onChange(toLocalDateTime(next));
  };

  const updateTime = (field, rawValue) => {
    const next = selected || new Date();
    next.setSeconds(0, 0);
    if (field === 'hour') next.setHours(Number(rawValue));
    if (field === 'minute') next.setMinutes(Number(rawValue));
    onChange(toLocalDateTime(next));
    setViewDate(next);
  };

  const chooseToday = () => {
    const now = new Date();
    onChange(toLocalDateTime(now));
    setViewDate(now);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={`input input-solid flex h-[42px] items-center justify-between gap-3 text-left ${selected ? '' : 'text-page-muted'}`}
        aria-label={ariaLabel || placeholder}
        onClick={() => {
          setViewDate(selected || new Date());
          setOpen((current) => !current);
        }}
      >
        <span className="truncate">{displayValue}</span>
        <span className="text-page-muted">v</span>
      </button>

      {open && (
        <div className="select-panel absolute left-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl p-3 text-sm text-page">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button type="button" className="btn-secondary px-3 py-1.5" onClick={() => setViewDate(addMonths(viewDate, -1))}>
              {'<'}
            </button>
            <div className="font-semibold">
              {new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(viewDate)}
            </div>
            <button type="button" className="btn-secondary px-3 py-1.5" onClick={() => setViewDate(addMonths(viewDate, 1))}>
              {'>'}
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs text-page-muted">
            {weekdays.map((day) => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const inMonth = day.getMonth() === viewDate.getMonth();
              const active = sameDay(day, selected);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  className={`rounded-lg px-0 py-1.5 text-center text-sm transition-colors ${
                    active
                      ? 'bg-brand-600 text-white'
                      : inMonth
                        ? 'hover:bg-page-surface-hover'
                        : 'text-page-muted hover:bg-page-surface-hover'
                  }`}
                  onClick={() => updateDate(day)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <select
              className="input input-solid"
              value={selected?.getHours() ?? new Date().getHours()}
              onChange={(event) => updateTime('hour', event.target.value)}
            >
              {Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{pad(hour)}</option>)}
            </select>
            <select
              className="input input-solid"
              value={selected?.getMinutes() ?? new Date().getMinutes()}
              onChange={(event) => updateTime('minute', event.target.value)}
            >
              {Array.from({ length: 60 }, (_, minute) => <option key={minute} value={minute}>{pad(minute)}</option>)}
            </select>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <button type="button" className="btn-secondary px-3 py-1.5" onClick={() => onChange('')}>
              {t('logs.clearFilter')}
            </button>
            <button type="button" className="btn-primary px-3 py-1.5" onClick={chooseToday}>
              {t('logs.today')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
