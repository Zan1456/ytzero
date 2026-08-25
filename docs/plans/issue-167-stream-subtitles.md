# #167 — strumieniowanie napisów bez zapisu na dysku

Napisy do lokalnego i bezpośredniego odtwarzacza są rozwiązywane na żądanie z
metadanych yt-dlp i przekazywane przez wewnętrzny proxy WebVTT. Nie wymagają
lokalnego pobrania filmu ani nie tworzą sidecarów. Istniejące sidecary pełnych
pobrań i napisy TubeArchivist mają pierwszeństwo, dzięki czemu nadal działają
offline.

Adresy podpisanych ścieżek pozostają wyłącznie w krótkim cache'u pamięci,
izolowanym profilem i filmem. Proxy akceptuje tylko HTTPS do domen YouTube lub
Google Video, ponownie waliduje ograniczoną liczbę przekierowań i nie ujawnia
upstreamowych URL-i przeglądarce. Wpisy HLS oraz formaty inne niż bezpośredni
WebVTT nie są oferowane jako ścieżki odtwarzacza.

Zmiana nie wprowadza danych trwałych, migracji ani zmian portable backup.
Ustawienie sidecarów dla pełnych pobrań pozostaje bez zmian.
