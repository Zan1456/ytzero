# #166 — sesyjna kolejka odtwarzania

## Zrealizowany zakres

- Kolejka odtwarzania jest wersjonowanym, ograniczonym do 100 pozycji stanem
  `sessionStorage`; przetrwa odświeżenie, ale nie zamknięcie karty.
- Akcja jest dostępna na wspólnych kartach wideo i w kompaktowych sugestiach.
  Dla zewnętrznych filmów zapisuje metadane od razu, a import uruchamia w tle.
- Globalny panel pokazuje licznik, pozycje, usuwanie, czyszczenie, rozpoczęcie
  odtwarzania oraz zapis kolejki jako osobistej playlisty.
- Kolejka sesyjna jest ciągłą, uporządkowaną listą odtwarzania. Aktualny film
  staje się jej tymczasową głową tylko wtedy, gdy nie jest już jej elementem.
  Jawnie otwarte playlisty i pokoje Watch Together zachowują pierwszeństwo.
- Następny i poprzedni element działają dla kolejki również przez Media Session.
- Zapis playlisty jest atomowy i zachowuje kolejność pozycji.

## Dane i backup

Kolejka jest przejściowym stanem pojedynczej karty. Nie jest ustawieniem,
nie ma tabeli ani migracji i nie trafia do portable backup. Kontekst `session`
jest walidowany dla żądania sąsiedniego filmu, lecz celowo nie jest zapisywany
w `user_videos.playback_context_json`; dzięki temu nie może odżyć po kolejnej
sesji przeglądarki. Zapisana playlista używa istniejącego, przenośnego modelu
playlist i członkostw.
