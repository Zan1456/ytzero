# #165 — akcje bezpośrednio z wyników wyszukiwania YouTube

## Zrealizowany zakres

- Wyniki YouTube są renderowane przez istniejący `VideoCard`, z tym samym
  konfigurowalnym menu co wyniki lokalne.
- Pobranie, harmonogram i dodanie do osobistej playlisty importują brakujący
  film na żądanie, bez otwierania strony filmu.
- Import jest idempotentny i współdzieli równoległe żądania dla tego samego
  filmu; film istniejący w bibliotece nie powoduje kolejnego extraction.
- Wyniki wyszukiwania zawierają identyfikator kanału oraz profilowy stan
  pobrania i kolejki. Względna data publikacji jest oznaczona jako przybliżona.
- Zewnętrzne karty nie udostępniają akcji archiwizacji ani oznaczania jako
  obejrzane, ponieważ nie należą do zakresu importu na żądanie.
- Reguła CSS poprawnie ukrywa pusty separator po kanale w poziomym układzie
  wyników.

## Dane i backup

Zmiana korzysta wyłącznie z istniejącego katalogu zewnętrznych filmów,
profilowego stanu kolejki, playlist i pobrań. Nie dodaje trwałych pól,
migracji ani zmian formatu portable backup.
