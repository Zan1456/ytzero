import { localeFormats } from "../localeFormats";
import { en } from "./en";
import type { Locale } from "../types";

/** French locale. Individual messages are progressively translated below. */
export const fr: Locale = {
  ...en,
  messages: { ...en.messages },
  buckets: { ...en.buckets },
  iconLabels: { ...en.iconLabels },
  format: localeFormats.fr,
};
