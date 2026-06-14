const parseCustomConfig = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    return {};
  }
};

const firstText = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
};

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const getLocalizedText = (source, language) => {
  if (!isObject(source)) return '';
  const lang = String(language || '').startsWith('zh') ? 'zh' : 'en';
  return firstText(
    source[lang],
    source[`${lang}-CN`],
    source[`${lang}_CN`],
    lang === 'zh' ? source.zhCN : source.enUS,
    lang === 'zh' ? source.zh_cn : source.en_us,
  );
};

const isChineseText = (value) => /[\u3400-\u9fff]/.test(String(value || ''));

const localizedFirstText = (language, translatedFallback, ...values) => {
  const hasLanguage = Boolean(language);
  const lang = String(language || '').startsWith('zh') ? 'zh' : 'en';
  for (const value of values) {
    const localized = getLocalizedText(value, lang);
    if (localized) return localized;
    if (typeof value === 'string' && value.trim()) {
      const text = value.trim();
      if (!hasLanguage || lang !== 'en' || !isChineseText(text)) return text;
    }
  }
  return translatedFallback;
};

export function getHomeContent(site, t, language) {
  const config = parseCustomConfig(site?.custom_config);
  const home = config.home && typeof config.home === 'object' ? config.home : {};

  return {
    heroTagline: localizedFirstText(
      language,
      t('home.heroTagline'),
      home.heroTagline,
      home.hero_tagline,
      config.heroTagline,
      config.hero_tagline,
    ),
    heroSubtitle: localizedFirstText(
      language,
      t('home.heroSubtitle'),
      home.heroSubtitle,
      home.hero_subtitle,
      config.heroSubtitle,
      config.hero_subtitle,
    ),
    heroImage: firstText(
      home.heroImage,
      home.hero_image,
      home.heroImageUrl,
      home.hero_image_url,
      config.heroImage,
      config.hero_image,
      config.heroImageUrl,
      config.hero_image_url,
    ),
  };
}
