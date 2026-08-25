# #168 — skalowalna lokalizacja interfejsu

Implementacja rozszerza interfejs o francuski, hiszpański, portugalski
brazylijski, rosyjski i japoński. Katalog `shared/uiLanguages.ts` jest jednym
kontraktem kodów, tagów BCP 47 i nazw natywnych dla klienta oraz serwera.

Locale są ładowane leniwie, a język jest nadal przenośnym ustawieniem profilu.
Sekcja `profile.settings` ma schema v7; import starszych archiwów jest
kompatybilny, zaś nieobsługiwany kod języka normalizuje się do angielskiego.

Docelowo każdy nowy język wymaga wpisu w katalogu, loadera oraz kompletnego
modułu locale. Sortowanie watchlisty i nagłówek `Accept-Language` korzystają z
tego samego katalogu.
