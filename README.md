# Huize Chaos

Gezinsplanner, recepten, voorraad en boodschappen.

Versie 1.3.40 voegt een echte verzendbevestiging per boodschap toe. Een nieuw product krijgt nu de status wachtend totdat Firebase de opslag heeft bevestigd. Mislukt de opslag, dan blijft het product lokaal bewaard en probeert de app het automatisch iedere vijf seconden opnieuw. Een online ID alleen geldt niet langer als bewijs dat het product is gesynchroniseerd. Hierdoor kan de algemene status niet meer ten onrechte Gesynchroniseerd tonen terwijl een boodschap ontbreekt.

Zie `FIREBASE-INSTELLEN.md` voor de eenmalige Firebase-instelling en het toevoegen van gezinsleden zonder e-mailadressen te delen.
