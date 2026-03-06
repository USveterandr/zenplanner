'use client';

import { translations, t as interpolate } from '@/lib/i18n';
import type { Locale, Translations } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';

/**
 * Returns the current translations object and a helper `t` function
 * that supports simple {key} interpolation.
 *
 * Usage:
 *   const { tr, t } = useTranslation();
 *   t(tr.welcomeUser, { name: 'Alice' }) // → "Welcome, Alice!"
 */
export function useTranslation() {
  const locale = useAppStore((s) => s.locale);
  const tr: Translations = translations[locale] ?? translations['en'];

  function t(key: keyof Translations, params?: Record<string, string>): string {
    return interpolate(tr[key], params);
  }

  return { tr, t, locale };
}
