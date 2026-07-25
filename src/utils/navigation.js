export function getSiteNavItems({ t, site }) {
  return [
    { to: '/', label: t('nav.home'), auth: false },
    { to: '/pricing', label: t('nav.pricing'), auth: false },
    ...(site?.allow_sub_dist
      ? [{ to: '/ai-api-reseller-platform', label: t('subDist.nav'), auth: false }]
      : []),
    { to: '/tokens', label: t('quickstart.badge'), auth: true },
    ...(site?.enable_topup
      ? [{ to: '/topup', label: t('nav.topup'), auth: true }]
      : []),
    { to: '/dashboard', label: t('nav.dashboard'), auth: true },
  ];
}

export function getVisibleNavItems(navItems, user) {
  return navItems;
}

export function isSiteNavActive(pathname, to) {
  return pathname === to || (to !== '/' && pathname.startsWith(`${to}/`));
}
