# Huize Chaos

Gezinsplanner, recepten, voorraad en boodschappen.

Versie 1.3.42 herstelt dat een lokale productwijziging bij sommige gezinsaccounts de verzendfunctie niet activeerde. Elke toevoeging, wijziging, verwijdering of afvinking verstuurt nu een vast wijzigingssignaal naar de Firebase-module. De zichtbare status verandert direct naar 'Wacht op synchronisatie' en daarna pas naar 'Gesynchroniseerd' zodra de opslag is bevestigd. De bestaande functie-aanroep blijft als extra terugvalroute actief.

Zie `FIREBASE-INSTELLEN.md` voor de eenmalige Firebase-instelling en het toevoegen van gezinsleden zonder e-mailadressen te delen.
