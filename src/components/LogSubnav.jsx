import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function LogSubnav({ active }) {
  const { t } = useTranslation();
  const items = [
    { key: 'logs', to: '/logs', label: t('logs.callLogs') },
    { key: 'tasks', to: '/tasks', label: t('tasks.title') },
  ];

  return (
    <div className="mb-6 flex justify-center">
      <div className="inline-flex rounded-full border border-[#E5D4C6] bg-white/75 p-1.5 shadow-[0_10px_30px_rgba(82,61,43,0.06)]">
        {items.map((item) => (
          <Link
            key={item.key}
            to={item.to}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active === item.key
                ? 'bg-[#D97757] text-white shadow-sm'
                : 'text-[#806D5D] hover:bg-[#F8EAE0] hover:text-[#3D3024]'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
