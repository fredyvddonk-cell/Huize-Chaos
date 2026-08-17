# Huize Chaos

Gezinsplanner, recepten, voorraad en boodschappen.

Versie 1.3.39 herstelt een fout waarbij een gezinslid kort na het openen van de app een boodschap kon toevoegen voordat de eerste synchronisatie klaar was. Het versturen werd dan overgeslagen en alleen bij de eigenaar later hervat. Wachtende boodschappen worden nu voor alle accounts automatisch verstuurd zodra de verbinding gereed is. De status toont voortaan 'Wacht op synchronisatie' totdat dit werkelijk is gebeurd.

Zie `FIREBASE-INSTELLEN.md` voor de eenmalige Firebase-instelling en het toevoegen van gezinsleden zonder e-mailadressen te delen.
