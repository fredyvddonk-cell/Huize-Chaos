## V1.3.79
- Feestdagen & gelegenheden: bij **Te veel** kan nu **Aantal over** worden ingevuld.
- Per gelegenheid is een vooraf-lijst **Wat heb ik nodig?** toegevoegd, met hoeveelheid en afvinken.
- Per gelegenheid is een lijst **Voorbereiden** toegevoegd, met optionele datum en afvinken.
- Openstaande benodigdheden en voorbereidingen zijn zichtbaar op de kaart van de gelegenheid.
- Geen productafbeeldingen toegevoegd.
- Git-bestanden worden niet meer meegeleverd in de distributie-zip.

## V1.3.78
- Voorraadstatus is alleen In huis / Niet in huis; Kopen is een apart vinkje.
- Feestdagen & gelegenheden toegevoegd met aantal personen, productcategorieën Eten/Hapjes/Dranken/Overig, kosten per categorie, gekochte aantallen en Te veel/Precies goed/Te weinig.
- Algemene evaluatie per gelegenheid.
- Geen productafbeeldingen toegevoegd.

## V1.3.77
- De volledige kruiden-, specerijen- en kruidenmixdatabase wordt nu **éénmalig toegevoegd aan bestaande voorraad**.
- Bestaande kruiden blijven volledig behouden; status, memo, hoeveelheid en winkel worden niet overschreven.
- Alleen ontbrekende kruidennamen worden toegevoegd, zonder dubbelen.
- Volledige uitgebreide kruiden-, specerijen- en kruidenmixdatabase toegevoegd aan categorie Kruiden.
- Bij **Kies uit je voorraad** is de knop **Alles deselecteren** toegevoegd; hiermee wordt de volledige voorraadselectie gewist.
- **Diepvries** is toegevoegd aan de voorraadgroepen waarmee passende recepten gezocht kunnen worden.
- Versie- en cacheverwijzingen bijgewerkt naar V1.3.79.


## V1.3.74
- Voorraadstatussen hernoemd naar **In huis**, **Niet in huis** en **Kopen**.
- **Niet in huis** zet een product niet op de boodschappenlijst; **Kopen** wel.
- Vanuit Recepten kunnen passende recepten worden gezocht op geselecteerde voorraad uit Bewaarproducten, Groente en Vlees/vis.
- Receptresultaten worden gerangschikt als Alles in huis, Bijna compleet of Past bij voorraad.
- Na **Recept gemaakt** toont Huize Chaos eerst een controleerbaar afboekoverzicht.
- Voorraad wordt pas na bevestiging afgeboekt; hoeveelheden kunnen vóór bevestiging worden aangepast.
- Producten die door afboeken op 0 komen, krijgen status **Niet in huis** en gaan niet automatisch naar de boodschappenlijst.

Versie 1.3.64 voegt gerichte ondersteuning toe voor papieren kassabonnen als foto, met de Jumbo-zelfscanbon als eerste test. De werkende PDF-parsers uit V1.3.63 blijven ongewijzigd.

Nieuw:
- Foto-OCR robuuster gemaakt met een extra verbeterde beeldherkenningspoging als de eerste uitlezing te weinig productregels oplevert.
- Totale bedrag wordt herkend als eindtotaal.
- Datumherkenning kan een afgebroken datumregel zoals 19-08- / 2026 verwerken.
- Losse prijsregels kunnen aan de productnaam erboven worden gekoppeld.
- Koopzegels, privacytekst, aantallen, medewerker- en winkelregels worden niet als producten opgenomen.
- Bestaande Jumbo-, AH- en Picnic-PDF-inlezing blijft behouden.

## V1.3.73
- AH-koopzegels worden niet meer als productregel herkend.
- Een detailregel zoals `39 X 0,10` wordt na `KOOPZEGELS PREMIUM` overgeslagen.
- Het koopzegelbedrag blijft wel correct van het kassabedrag afgetrokken.


## V1.3.73
- Delen naar Huize Chaos ondersteunt nu bonbestanden én recepttekst/receptlinks.
- Gedeelde recepten komen onder **Te controleren** en synchroniseren via Firebase zodat controle op telefoon of laptop kan.
- Receptlinks worden waar mogelijk via Recipe/JSON-LD uitgelezen; als een website dat blokkeert blijft de bronlink bij het concept staan.
- Gedeelde bonnen worden als **Te controleren** opgeslagen en tellen pas na goedkeuren mee in Inzicht/budget.
