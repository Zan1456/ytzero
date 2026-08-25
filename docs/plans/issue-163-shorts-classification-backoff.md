# #163 — ograniczenie ponownej klasyfikacji Shorts

Klasyfikacja Shorts zapisuje teraz każdą sieciową próbę w katalogu filmów i
stosuje wykładniczy backoff: 30 minut, 1, 2, 4, 8 i 16 godzin, a następnie
maksymalnie raz na dobę. Niejednoznaczny wynik nadal pozostaje `NULL`, dzięki
czemu automatyczne zadania nie potraktują filmu jak zwykłego, ale nie powoduje
już zapytania przy każdym odświeżeniu.

Filmy dłuższe niż trzy minuty są rozstrzygane lokalnie jako nie-Shorty, a
`#short`/`#shorts` zachowuje istniejącą klasyfikację lokalną. Feed najpierw
uzupełnia długości, a potem wykonuje backfill; playlisty i pełne synchronizacje
wykorzystują długość już otrzymaną w ich metadanych.

Stan prób jest odbudowywalnym stanem katalogu i nie trafia do portable backupu.
Migracja obejmuje SQLite i PostgreSQL, a testy pokrywają heurystyki, harmonogram
backoffu, migrację oraz wykluczenie backupowe.
