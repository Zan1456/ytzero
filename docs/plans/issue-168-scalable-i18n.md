# #168 — skalowalna lokalizacja interfejsu

Implementacja rozszerza interfejs o francuski, hiszpański, portugalski
brazylijski, rosyjski i japoński. Katalog `shared/uiLanguages.ts` jest jednym
kontraktem kodów, tagów BCP 47 i nazw natywnych dla klienta oraz serwera.

Wszystkie osiem obsługiwanych języków ma kompletny katalog komunikatów:
angielski (`en`), polski (`pl`), niemiecki (`de`), francuski (`fr`), hiszpański
(`es`), portugalski brazylijski (`pt-BR`), rosyjski (`ru`) i japoński (`ja`).
Aktualna lista oraz procedura dodawania kolejnych języków są opisane w
[`docs/localization.md`](../localization.md).

Locale są ładowane leniwie, a język jest nadal przenośnym ustawieniem profilu.
Sekcja `profile.settings` ma schema v7; import starszych archiwów jest
kompatybilny, zaś nieobsługiwany kod języka normalizuje się do angielskiego.

Każdy nowy język wymaga wpisu w katalogu, loadera, kompletnego modułu locale i
reguł liczby mnogiej. Test katalogu pilnuje zgodności kluczy, niepustych wartości
oraz zachowania placeholderów. Sortowanie watchlisty i nagłówek
`Accept-Language` korzystają z tego samego katalogu.
