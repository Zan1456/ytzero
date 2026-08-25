# #164 — stan ładowania podczas importowania filmu

## Weryfikacja

Problem nadal występuje i poprawka nie jest zaimplementowana.

- Brak rekordu filmu powoduje, że `resolvePlayerKind()` zwraca `"youtube"`, nawet gdy włączony streaming wybrałby później lokalny stream.
- Istniejący test utrwala błędne zachowanie, oczekując `"youtube"` dla `hasVideo: false`.
- Import przebiega przez `videoInfo()`, które pobiera metadane i zapisuje film, po czym ponowne `video()` dostarcza rekord odtwarzaczowi.
- Samo zwrócenie `"loading"` nie wystarczy: `WatchPage` renderuje panel ładowania tylko przy istniejącym `video`, więc bez rekordu pojawiłoby się puste czarne pole zamiast spinnera.
- „Ok / Ok” nie zawiera dodatkowych wymagań wpływających na implementację.

## Plan implementacji

1. Zmienić `ui/src/pages/watchPlayerMode.ts`:
   - oddzielić warunki kwalifikujące film do eksperymentalnego streamingu od warunku `hasVideo`;
   - gdy rekord jeszcze nie istnieje, ale po jego pojawieniu zostałby wybrany streaming, zwracać `"loading"` zamiast `"youtube"`;
   - zachować dotychczasowe zachowanie dla wyłączonego streamingu, jawnego wyboru YouTube, odtwarzacza direct i istniejących filmów;
   - po pojawieniu się rekordu pozwolić obecnej logice automatycznie przejść ze `"loading"` do `"stream"` albo właściwego trybu dla transmisji live.

2. Zmienić `ui/src/pages/WatchPage.tsx`:
   - renderować istniejący panel ze spinnerem dla `"loading"` również wtedy, gdy obiekt `video` nie jest jeszcze dostępny;
   - użyć miniatury tylko opcjonalnie, jeśli rekord już istnieje;
   - wykorzystać obecne komponenty i style bez dodawania nowego CSS.

3. Zaktualizować `ui/src/pages/watchPlayerMode.test.ts`:
   - zmienić test braku rekordu przy aktywnym streamingu tak, aby oczekiwał `"loading"`;
   - potwierdzić, że brak rekordu nadal prowadzi do `"youtube"`, gdy streaming jest wyłączony lub użytkownik jawnie wybrał zdalne odtwarzanie;
   - zachować testy przejścia do `"stream"`, odtwarzania lokalnego, transmisji live, profilu dziecięcego i odtwarzacza direct.

4. Zweryfikować zmianę:
   - uruchomić `cd ui && bun test src/pages/watchPlayerMode.test.ts`;
   - uruchomić `cd ui && bun run typecheck`;
   - ręcznie otworzyć spoza biblioteki film ze strony wyszukiwania i z bezpośredniego linku;
   - potwierdzić sekwencję: spinner → właściwy odtwarzacz, bez chwilowego iframe YouTube i komunikatu „Video unavailable”;
   - sprawdzić wariant z wolniejszą odpowiedzią yt-dlp oraz zwykłe odtwarzanie filmu już istniejącego w bibliotece.

## Zakres

Zmiana dotyczy wyłącznie wyboru i renderowania trybu odtwarzacza. Nie wymaga zmian backendu, bazy danych, trwałych ustawień, backupów ani dokumentacji architektury.
