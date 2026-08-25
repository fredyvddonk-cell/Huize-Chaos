## V1.3.131
- Bonrekenhulp gebruikt vaste kortingspercentages voor gratis-acties: 1+1 = 50%, 2+1 = 33,33%, 2+2 = 50%, 2+3 = 60%.
- Verschillende prijzen binnen dezelfde actie worden eerst opgeteld; de korting wordt over het totale normale bedrag berekend.
- Aantal en normale stukprijs worden automatisch uit de bonregel ingevuld; bij AH-regels met aantal + stukprijs + totaal wordt de stukprijs expliciet bewaard.
- Knop “Gebruik betaald bedrag” verwijderd; zodra een actie is gekozen of aangepast wordt het betaalde bedrag direct verwerkt.
- Normale stukprijs blijft de prijs vóór korting.

## V1.3.131
- Bonrekenhulp ondersteunt acties met verschillende productprijzen.
- Aantal en prijs worden vooraf ingevuld vanuit de bonregels.
- Bij gratis-acties worden de goedkoopste producten correct als korting verwerkt.
- Oorspronkelijke productprijzen blijven bewaard voor herberekenen.

## V1.3.131
- Budget Verzorging wordt alleen in de maandweergave getoond.
- Jaarbudget Huishouden wordt alleen in de maandweergave getoond.
- De weekweergave blijft gericht op het weekbudget Boodschappen.

## V1.3.131
- In Inzicht is **Huishouden** toegevoegd als derde budgetblok naast Boodschappen en Verzorging.
- Huishouden telt niet meer mee in het boodschappenbudget.
- Huishouden gebruikt een **jaarbudget** en toont **besteed dit jaar** en **nog beschikbaar**.
- Het jaarbudget Huishouden wordt meegenomen in de bestaande synchronisatie.

## V1.3.131
- Voorraadcontrole bij geplande recepten beschikbaar voor de huidige én volgende week.
- Kruiden en Bewaarproducten hebben knoppen ‘Alles in huis’ en ‘Alles niet in huis’, met bevestiging.
- De bulkknoppen wijzigen alleen de voorraadstatus; Kopen blijft ongemoeid.

## V1.3.131
- Receptdetail: **Terug** hergebruikt de bestaande receptenlijst en start niet opnieuw de zware voorraadmatch.
- **Uit voorraad recepten zoeken**: voorraadproducten staan alfabetisch A-Z.
- Voorraadkiezer heeft een **Zoek product…**-veld; zoeken gebeurt in de hele productnaam (bijv. `paprika` vindt ook `geroosterde paprika`).
- Voorraad-receptmatch wordt pas berekend na **Passende recepten zoeken** en daarna tijdelijk hergebruikt.
- Bij **Wijzigen** van een recept is **Verwijder recept** toegevoegd met bevestiging. Verwijderde basisrecepten blijven ook na herladen verborgen en synchroniseren mee.


## V1.3.123
- Gezinsplanner: opstartfout opgelost waardoor `applyHuizeChaosPlannerRole` niet beschikbaar kwam.
- Oorzaak: `renderStudy()` werd tijdens het opstarten uitgevoerd voordat `studyTimerInterval` was geïnitialiseerd.
- De studietimer wordt nu vóór de eerste render geïnitialiseerd, zodat `app.js` volledig kan laden en de Firebase-plannerkoppeling kan starten.
- Diagnosemelding uit V1.3.122 blijft beschikbaar voor eventuele vervolgproblemen.

## V1.3.80

- Iedere gelegenheid heeft nu een eigen Menu.
- Gerechten kunnen los worden ingevoerd; een bestaand recept is niet verplicht.
- Per menuonderdeel kunnen benodigdheden worden vastgelegd.
- Voorbereidingen ondersteunen nu zowel een optionele datum als tijd.
- Per gelegenheid kan een boodschappenlijst worden gemaakt uit openstaande benodigdheden en menu-benodigdheden.
- De boodschappenlijst kan worden afgevinkt en aangepast.
- Evaluatie met Te veel + Aantal over uit V1.3.79 blijft behouden.
- Geen productafbeeldingen en geen Git-bestanden in de distributie.

## V1.3.80
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
- Versie- en cacheverwijzingen bijgewerkt naar V1.3.80.


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

## V1.3.123
- Gezinsplanner: gerichte diagnose toegevoegd voor de toegangsfout.
- De algemene Firebase-melding toont nu de exacte stap, foutcode en fouttekst.
- Geen beveiligingsregels versoepeld; deze versie is bedoeld om de werkelijke oorzaak veilig vast te stellen.


## V1.3.73
- AH-koopzegels worden niet meer als productregel herkend.
- Een detailregel zoals `39 X 0,10` wordt na `KOOPZEGELS PREMIUM` overgeslagen.
- Het koopzegelbedrag blijft wel correct van het kassabedrag afgetrokken.


## V1.3.73
- Delen naar Huize Chaos ondersteunt nu bonbestanden én recepttekst/receptlinks.
- Gedeelde recepten komen onder **Te controleren** en synchroniseren via Firebase zodat controle op telefoon of laptop kan.
- Receptlinks worden waar mogelijk via Recipe/JSON-LD uitgelezen; als een website dat blokkeert blijft de bronlink bij het concept staan.
- Gedeelde bonnen worden als **Te controleren** opgeslagen en tellen pas na goedkeuren mee in Inzicht/budget.


## V1.3.121
- Gezinsplanner: vast dagelijks huishoudblok van 30 minuten toegevoegd.
- Het blok gebruikt de huishoudtaken die al in de bestaande planner staan; er worden geen dubbele poetstaken aangemaakt.
- Timer kan worden gepauzeerd of na 30 minuten worden afgerond.
- Na afronden kan optioneel 15 of 30 minuten extra worden toegevoegd.
- De timer start iedere kalenderdag opnieuw op 30 minuten; gemiste tijd wordt niet opgeteld bij de volgende dag.

## V1.3.121
- Huishoudtijd verplaatst naar de pagina Vandaag, met directe koppeling naar Huishouden.
- Dagelijks studieblok toegevoegd: minimum 60 minuten, streefdoel 90 minuten en daarna vrij doorlopen.
- Studieperiode staat standaard t/m 15 november 2026 en kan eerder worden beëindigd of worden verlengd met een nieuwe einddatum.
- Nieuw onderdeel Mijn notities toegevoegd. Notities worden per eigenaar opgeslagen in privateNotes en zijn niet zichtbaar voor gezinsleden.
