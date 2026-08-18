export function getSiteNavItems({ t, site }) {
  return [
    { to: '/#hero', sectionId: 'hero', label: t('nav.home'), auth: false },
    { to: '/pricing', label: t('nav.pricing'), auth: false },
    ...(site?.allow_sub_dist
      ? [{ to: '/ai-api-reseller-platform', label: t('nav.apiAggregation'), auth: false }]
      : []),
    { to: '/docs/overview', label: t('nav.docs'), auth: false },
    { to: '/#contact', sectionId: 'contact', label: t('nav.contact'), auth: false },
  ];
}

export function getVisibleNavItems(navItems, user) {
  return navItems;
}

export function isSiteNavActive(pathname, to) {
  return pathname === to || (to !== '/' && pathname.startsWith(`${to}/`));
}
