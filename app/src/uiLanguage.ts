import { LOCALE_TAGS, normalizeLanguage, type Language } from "../../shared/uiLanguages";

export { normalizeLanguage, type Language } from "../../shared/uiLanguages";

/** BCP 47 tag for server-side sorting and outbound request headers. */
export function localeForLanguage(value: unknown): string {
  return LOCALE_TAGS[normalizeLanguage(value)];
}
