# Huize Chaos V1.4.151

- Zoekveld en plusknop in Boodschappen/Voorraad compacter gemaakt.
- Productsuggesties verschijnen tijdens het typen.
- Selecteren van een suggestie springt naar het betreffende product.
- Geselecteerd product wordt kort gemarkeerd.
- Bestaande functies uit V1.4.147 behouden.

# Huize Chaos V1.4.151

## V1.4.151
- Voorraad & Boodschappen opent zonder expliciete deeplink altijd op Boodschappen.
- Elke hoofdmodule heeft rechtsboven hetzelfde hamburgermenu om direct naar Home of een andere module te gaan.
- De wijziging in Voorraad & Boodschappen is in de modulecode zelf verwerkt; niet alleen het versienummer is aangepast.

## V1.4.144
- Startscherm toont Boodschappen alleen wanneer er een open boodschap staat.
- De ▼ naast Boodschappen en Voorraad opent nu betrouwbaar Hutsel Frutsel, Inzicht en Beheer.
- Boodschappen toont ‹ Week ›, Alles inklappen en Printen compact op één regel.
- Winkel/Categorie blijft de bestaande keuze onder de weekregel.
- Voorraad houdt Weekcheck en Maandcheck als hoofdkeuze; Filter verfijnt binnen de gekozen check.

## V1.4.144
- Startscherm: vanaf zaterdag wordt het menu van de volgende week getoond als dat al is ingevuld.
- Het blok Volgende week toont alleen de gerechtnaam en blijft compacter dan de huidige week.
- Op maandag t/m vrijdag blijft alleen de huidige week zichtbaar.


## V1.4.144
- Dubbele kop “Verlanglijstjes” verwijderd; in het tabblad staat nu direct de knop + Wens toevoegen.
- Auto opent standaard op Tankbeurten.
- Auto toont bovenaan alleen Tankbeurten en Kilometers.
- Reserveren is voorlopig uit de zichtbare Auto-interface gehaald, zodat deze functie later eventueel terug kan komen.
- Omschrijving van de Auto-module op het startscherm aangepast.

# Huize Chaos V1.4.133

## V1.4.133
- Gebaseerd op de schone V1.4.133-basis.
- Alleen de visuele huisstijl gelijkgetrokken; functionaliteit en navigatie zijn bewust niet aangepast.
- Gelijke lettergroottes, koppen, knoppen, formulieren, kaarten, marges en HC paars/lavendel-kleuren op alle modules.
- Eén gedeeld bestand `hc-theme.css` bepaalt de vaste HC-basisstijl.

## V1.4.133
- Variatie in het weekmenu toont pasta, rijst, noedels en andere maaltijdsoorten voortaan apart.
- Hoofdingrediënten worden apart meegeteld, zoals kip, rund, vis en vegetarisch.
- De algemene categorie Overig verdwijnt uit het variatieoverzicht.
- Woensdag friet met snacks en zaterdag soep met broodjes tellen mee als vaste maaltijdsoorten.
- Bij 3 of meer gelijke maaltijdsoorten of hoofdingrediënten verschijnt een korte waarschuwing.

## V1.4.133
- Productverwijdering is nu synchronisatiebestendig: verwijderde voorraadproducten krijgen een tombstone en kunnen niet door een oudere laptop/telefoonkopie teruggezet worden.
- Verwijderingen worden via Firebase tussen apparaten gedeeld.

## V1.4.133
- Maaltijdvoorraad blijft zichtbaar wanneer een product op Niet in huis wordt gezet.
- In huis/Niet in huis verandert alleen de voorraadstatus, niet de indeling Maaltijdvoorraad.
- Producten op Niet in huis kunnen vanuit Maaltijdvoorraad eenvoudig weer op In huis worden gezet.


## V1.4.133
- Bij een geopend recept staat nu per ingrediënt direct ✓ In huis, ✕ Niet in huis of ≈ Alternatief mogelijk.
- De status gebruikt dezelfde voorraadkoppeling en matching als de bestaande recept-voorraadcontrole.
- Op mobiel blijft de status compact: het symbool blijft zichtbaar zonder onnodig brede regels.
- De knop Toevoegen aan weekmenu blijft direct bij het geopende recept beschikbaar.
- Alle wijzigingen uit V1.4.133 blijven behouden.

## V1.4.133
- Laptopfilters bij Recept kiezen lopen nu automatisch door op meerdere regels; keuzes worden niet meer rechts afgesneden.
- Past bij voorraad gebruikt geen harde 45%-grens meer: recepten met minimaal één passend voorraadingrediënt worden getoond en op beste match gesorteerd.
- Voorraadmatch wordt bij openen opnieuw berekend, zodat een oude cache na synchronisatie geen lege lijst veroorzaakt.


## V1.4.133

- In huis / Niet in huis weer direct wijzigbaar in Voorraad.
- Voorraadstatus ook toegevoegd aan Product wijzigen.
- Voorraadstatus blijft los van Kopen.
- Koppeling Voorraad → Lijst bij Kopen hersteld door de boodschappenmodule weer de actuele JavaScript-bestanden te laten laden.
- Verouderde V1.4.133 cache-verwijzingen in Voorraad & Boodschappen vervangen door V1.4.133.
- Service-worker cache vernieuwd zodat telefoon en laptop de nieuwe modulebestanden ophalen.
- Bestaande voorraad-, synchronisatie-, recept- en PDF-functies behouden.


## V1.4.133
- Modulekoppen kleiner en minder prominent.
- Verticale ruimte rond paginatitels, tabs en eerste inhoudsblok verkleind.

## V1.4.144
- Bovenkant van alle modules compacter en rustiger gemaakt.
- Logo, woordmerk, versie, modulekoppen en submenu's kleiner gemaakt.
- Minder verticale witruimte vóór de inhoud.
- Dubbele kop Tankbeurten/Kilometers bij Auto verwijderd.
- Dubbele kop Vandaag in Gezinsplanner visueel verwijderd; datum blijft zichtbaar.

## V1.4.144
- Boodschappen en Voorraad tonen producten compacter als echte lijstregels.
- Minder verticale witruimte per product.
- Geen losse afgeronde productkaarten binnen een categorie.
- Status, Kopen en Hutsel compacter gehouden.