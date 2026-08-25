# #162 — napisy dostępne dla konkretnego filmu

Menu lokalnego odtwarzacza pobiera teraz rzeczywistą dostępność napisów przez
yt-dlp zamiast wyświetlać stały katalog języków. Ręczne napisy autora są zawsze
widoczne, a automatyczne tylko dla języków preferowanych przez aktywny profil.

Techniczne, 11-znakowe sufiksy YouTube przypisane do ścieżek audio są grupowane
pod czytelnym kodem języka, z zachowaniem kolejnych ścieżek jako fallbacków.
Regionalne warianty, takie jak `pt-BR` i `zh-Hans`, pozostają odrębne.

Dostępność jest krótko cache'owana wyłącznie w pamięci. Pobieranie wybranego
języka sprawdza tę dostępność po stronie serwera, próbuje kolejnych ścieżek i
ponawia raz zapytanie ograniczone przez 429. Nie zmienia to bazy danych,
backupów ani ustawień trwałych.
