import React from 'react';
import DownloadCatalog from '../components/DownloadCatalog';

export default function Clients() {
  return (
    <div className="min-h-[calc(100dvh-64px)] bg-page-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <DownloadCatalog mode="all" />
      </div>
    </div>
  );
}
