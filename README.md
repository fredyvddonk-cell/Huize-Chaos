# Huize Chaos V1.4.112

## V1.4.112
- Bij een geopend recept staat nu per ingrediënt direct ✓ In huis, ✕ Niet in huis of ≈ Alternatief mogelijk.
- De status gebruikt dezelfde voorraadkoppeling en matching als de bestaande recept-voorraadcontrole.
- Op mobiel blijft de status compact: het symbool blijft zichtbaar zonder onnodig brede regels.
- De knop Toevoegen aan weekmenu blijft direct bij het geopende recept beschikbaar.
- Alle wijzigingen uit V1.4.111 blijven behouden.

## V1.4.112
- Laptopfilters bij Recept kiezen lopen nu automatisch door op meerdere regels; keuzes worden niet meer rechts afgesneden.
- Past bij voorraad gebruikt geen harde 45%-grens meer: recepten met minimaal één passend voorraadingrediënt worden getoond en op beste match gesorteerd.
- Voorraadmatch wordt bij openen opnieuw berekend, zodat een oude cache na synchronisatie geen lege lijst veroorzaakt.


## V1.4.112

- In huis / Niet in huis weer direct wijzigbaar in Voorraad.
- Voorraadstatus ook toegevoegd aan Product wijzigen.
- Voorraadstatus blijft los van Kopen.
- Koppeling Voorraad → Lijst bij Kopen hersteld door de boodschappenmodule weer de actuele JavaScript-bestanden te laten laden.
- Verouderde V1.4.94 cache-verwijzingen in Voorraad & Boodschappen vervangen door V1.4.112.
- Service-worker cache vernieuwd zodat telefoon en laptop de nieuwe modulebestanden ophalen.
- Bestaande voorraad-, synchronisatie-, recept- en PDF-functies behouden.
