import { localeFormats } from "../localeFormats";
import { en } from "./en";
import type { Locale } from "../types";

export const es: Locale = {
  ...en,
  messages: { ...en.messages },
  buckets: { ...en.buckets },
  iconLabels: { ...en.iconLabels },
  format: localeFormats.es,
};
