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
