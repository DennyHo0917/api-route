export function getSiteNavItems({ t, site }) {
  return [
    { to: '/#hero', sectionId: 'hero', label: t('nav.home'), auth: false },
    { to: '/#features', sectionId: 'features', label: t('nav.audience'), auth: false },
    { to: '/#ecosystem', sectionId: 'ecosystem', label: t('nav.ecosystem'), auth: false },
    ...(site?.allow_sub_dist
      ? [{ to: '/#platform', sectionId: 'platform', label: t('nav.apiAggregation'), auth: false }]
      : []),
    { to: '/pricing', label: t('nav.modelMarketplace'), auth: false },
    { to: '/#contact', sectionId: 'contact', label: t('nav.contact'), auth: false },
  ];
}

export function getVisibleNavItems(navItems, user) {
  return navItems;
}

export function isSiteNavActive(pathname, to) {
  return pathname === to || (to !== '/' && pathname.startsWith(`${to}/`));
}
