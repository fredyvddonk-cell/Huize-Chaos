# Huize Chaos

Versie 1.3.45 voegt Boodschappen → Inzicht toe. Bonnen kunnen als digitale bon of foto worden geregistreerd, met winkel, datum, totaal en productregels. Uitgaven worden neutraal getoond per week/maand en verdeeld over 10 vaste inzichtcategorieën. Categorieën zijn handmatig aanpasbaar en voorraad wordt niet gewijzigd.

Gezinsplanner, recepten, voorraad en boodschappen.

Versie 1.3.42 herstelt dat een lokale productwijziging bij sommige gezinsaccounts de verzendfunctie niet activeerde. Elke toevoeging, wijziging, verwijdering of afvinking verstuurt nu een vast wijzigingssignaal naar de Firebase-module. De zichtbare status verandert direct naar 'Wacht op synchronisatie' en daarna pas naar 'Gesynchroniseerd' zodra de opslag is bevestigd. De bestaande functie-aanroep blijft als extra terugvalroute actief.

Zie `FIREBASE-INSTELLEN.md` voor de eenmalige Firebase-instelling en het toevoegen van gezinsleden zonder e-mailadressen te delen.
