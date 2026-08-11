# Firebase instellen voor Huize Chaos V1.2.0

## 1. GitHub Pages toestaan

1. Open Firebase Console.
2. Ga naar **Authentication** → **Settings** → **Authorized domains**.
3. Klik op **Add domain**.
4. Voeg toe: `fredyvddonk-cell.github.io`

## 2. Beveiligingsregels plaatsen

1. Ga naar **Firestore Database** → **Rules**.
2. Vervang de bestaande regels door de volledige inhoud van `firestore.rules`.
3. Klik op **Publish**.

De regels zorgen ervoor dat alleen goedgekeurde gebruikers bij de gezamenlijke boodschappenlijst kunnen. Gezinsleden kunnen een boodschap toevoegen en boodschappen afvinken. Alleen de eigenaar kan voorraadproducten verwerken en de leden beheren.

## 3. Eerste eigenaar toelaten zonder e-mailadres te delen

1. Zet V1.2.0 op GitHub Pages.
2. Open de boodschappenmodule en meld je aan met Google.
3. De app toont jouw persoonlijke Firebase-gebruikerscode (UID).
4. Kopieer deze code.
5. Ga in Firebase naar **Firestore Database** → **Data**.
6. Maak de collectie `households` met document-ID `huize-chaos`. Voeg tijdelijk het veld `name` met waarde `Huize Chaos` toe.
7. Open het document `huize-chaos` en maak de subcollectie `members`.
8. Gebruik jouw gekopieerde UID als document-ID.
9. Voeg het veld `role` toe als type **string** met waarde `owner`.
10. Vernieuw de app. Je hebt nu toegang als beheerder.

## 4. Gezinslid toelaten

1. Het gezinslid opent dezelfde app en meldt zich aan met het eigen Google-account.
2. De app toont diens UID.
3. Het gezinslid stuurt alleen die UID naar jou.
4. Open in Firebase: `households` → `huize-chaos` → `members`.
5. Maak een nieuw document met die UID als document-ID.
6. Voeg het veld `role` toe als type **string** met waarde `member`.
7. Na vernieuwen ziet het gezinslid alleen de gezamenlijke boodschappenlijst.

## Rollen

- `owner`: boodschappen, voorraad, Hutsel Frutsel en beheer.
- `member`: gezamenlijke boodschappen bekijken, toevoegen en afvinken.

Gebruik uitsluitend de exacte kleine letters `owner` en `member`.
