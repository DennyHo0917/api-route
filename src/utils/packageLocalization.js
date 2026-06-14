const exactNameKeys = {
  天卡: 'packages.planDaily',
  日卡: 'packages.planDaily',
  周卡: 'packages.planWeekly',
  月卡: 'packages.planMonthly',
};

function isEnglish(language) {
  return String(language || '').toLowerCase().startsWith('en');
}

function formatTierAmount(value) {
  return Number(value).toLocaleString('en-US');
}

export function getLocalizedPackageName(pkg, t, language) {
  const name = String(pkg?.name || '').trim();
  if (!name || !isEnglish(language)) return name;

  const exactKey = exactNameKeys[name];
  if (exactKey) return t(exactKey);

  const tierPatterns = [
    [/^(\d+)元专业用户卡$/, 'packages.planProfessional'],
    [/^(\d+)元深度用户卡$/, 'packages.planPowerUser'],
    [/^(\d+)元企业月卡$/, 'packages.planEnterpriseMonthly'],
    [/^(\d+)元企业卡$/, 'packages.planEnterprise'],
  ];

  for (const [pattern, key] of tierPatterns) {
    const match = name.match(pattern);
    if (match) {
      return t(key, { amount: formatTierAmount(match[1]) });
    }
  }

  if (/[\u3400-\u9fff]/u.test(name) && Number(pkg?.duration) > 0) {
    return t('packages.planDuration', { count: Number(pkg.duration) });
  }

  return name;
}

export function getLocalizedPackageDescription(pkg, t, language) {
  const description = String(pkg?.description || '').trim();
  if (!description || !isEnglish(language)) return description;

  if (/[\u3400-\u9fff]/u.test(description) && Number(pkg?.duration) > 0) {
    const duration = Number(pkg.duration);
    return t(
      duration === 1
        ? 'packages.planPeriodDescriptionOne'
        : 'packages.planPeriodDescriptionOther',
      { count: duration },
    );
  }

  return description;
}

export function localizePackage(pkg, t, language) {
  return {
    ...pkg,
    name: getLocalizedPackageName(pkg, t, language),
    description: getLocalizedPackageDescription(pkg, t, language),
  };
}
