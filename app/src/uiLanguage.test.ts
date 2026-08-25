import { describe, expect, test } from "bun:test";
import { LOCALE_TAGS } from "../../shared/uiLanguages";
import { localeForLanguage, normalizeLanguage } from "./uiLanguage";

describe("server UI-language normalization", () => {
  test("uses the shared catalogue for persisted settings and sorting locales", () => {
    expect(normalizeLanguage("pt-BR")).toBe("pt-BR");
    expect(normalizeLanguage("invalid")).toBe("en");
    expect(localeForLanguage("ru")).toBe(LOCALE_TAGS.ru);
    expect(localeForLanguage("invalid")).toBe("en-US");
  });
});
