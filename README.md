# Athletik – Trainings-App für iPhone

Web-App (PWA) für Muskelaufbau (70 %) und Athletik (30 %: Schnellkraft, Ausdauer, Mobilität).
Läuft vom iPhone-Homescreen wie eine normale App, auch offline im Gym. Kein App Store, kein Xcode nötig.

## Funktionen

- **Equipment vor jedem Training wählen** (oder Preset: Studio, Home-Gym, Hotel, Körpergewicht, Draußen) → passender Plan
- **Planung komplett ohne KI** mit eingebauter, evidenzbasierter Regel-Logik – inkl. Befinden des Tages (fit/normal/müde), dauerhafter Problemzonen und schwerster Kurzhantel im Home-Gym
- **Persönliche Rekorde** mit Feier nach dem Training und Rekordliste
- **Kurze Umfrage nach dem Training** (Gefallen, Beschwerden) + automatische Belastungseinschätzung aus den Wdh. – die nächsten Einheiten passen sich an
- **Richtwerte in kg** für jede Übung – aus deinen letzten Gewichten, passend zum Trainingsziel
- **Automatische Progression** aus Gewicht × Wiederholungen (doppelte Progression, Deload alle 5 Wochen, Übungswechsel bei Stagnation)
- **Wochen-Check ohne KI** (Coach-Tab): passt Sätze pro Muskel an, löst bei Ermüdung einen Deload aus, gibt Fokus und Tipps – optional zusätzlich mit Claude
- **Andere Trainings nachtragen** (HIIT, Joggen, Yoga, Kurse, CrossFit, Padel, Teamtraining, Spiele, Paddeln, Radfahren …) mit Dauer, Anstrengung und optional Strecke. Sie fließen in die Planung ein (z. B. kein Ausdauer-Finisher nach hartem HIIT gestern) und in den Wochen-Check
- **Diagramme**: Körpergewicht (mit 7-Tage-Mittel und optionalem Zielgewicht), Kraftentwicklung je Übung (geschätztes 1RM), Wochenvolumen pro Muskel, Monatsübersicht im Verlauf (wie oft welche Einheit)
- **Trainingsziele**: Muskelaufbau & Athletik, Kraftaufbau, Ausdauer, Marathon, HYROX, Sportartspezifisch (Fußball, Handball, Basketball, Volleyball, Tennis/Padel – mit Saisonphase und Spieltag), Allgemeine Fitness, Abnehmen
- **Videos & Technik**: Technikhinweise zu jeder Übung, YouTube-Suche mit einem Tipp, eigene Videos speichern und direkt in der App abspielen
- **Tempo pro Übung** (z. B. 3 s ablassen · 1 s Pause · explosiv zurück), wechselt im Trainingsblock
- **Supersätze bei wenig Zeit**: Drücken + Ziehen im Wechsel statt Übungen zu streichen
- **Intervall-Uhr** für 4×4, 30/30, 15/15, Sprints, EMOM … mit Belastungs-/Pausenanzeige, Zielpuls und Signaltönen
- **Pulszonen** aus Max- und Ruhepuls (Herzfrequenzreserve), ohne Eingabe aus dem Alter geschätzt
- **Ausgleich bei Beschwerden**: statt Schonung Stabilisations-, Mobilitäts- und Dehnübungen für die betroffene Region
- **Einheit aus dem Verlauf wiederholen** – gleiche Übungen, Gewichte nach aktuellem Stand
- **Körperzusammensetzung** (optional Muskelmasse und Körperfett) – der Plan reagiert auf Trends
- Pausen-Timer mit Signalton, Bildschirm bleibt während des Trainings an
- Backup als JSON-Datei (Export/Import)

Die wissenschaftliche Grundlage steht in [REGELWERK.md](REGELWERK.md).

## Lokal testen (Mac)

```bash
cd "Athletic App" && python3 tools/serve.py
```

Dann http://localhost:8765 im Browser öffnen.

## Live-Version

**https://g5s94t2r5n-alt.github.io/athletik/** (GitHub Pages, wird bei jedem Push auf `main` neu veröffentlicht)

Updates: Änderungen committen und `git push` – nach 1–2 Minuten ist die neue Version online.
Die App auf dem iPhone holt sie beim nächsten Öffnen mit Internet automatisch.

## Aufs iPhone bringen

Das iPhone braucht die App unter einer **HTTPS-Adresse**, damit sie offline funktioniert und sich installieren lässt.
Am einfachsten ist ein kostenloses Hosting für statische Seiten, z. B.:

- **Netlify Drop** (app.netlify.com/drop): kostenlos registrieren und diesen Ordner ins Browserfenster ziehen. Fertig.
- **GitHub Pages**: Ordner in ein Repository hochladen und unter Settings → Pages aktivieren.

Danach auf dem iPhone:

1. Adresse in **Safari** öffnen
2. Teilen-Symbol → **„Zum Home-Bildschirm“**
3. App vom Homescreen starten – fertig. Optional: Mehr → Claude-API-Key eintragen (console.anthropic.com) für den KI-Wochen-Check

Deine Trainingsdaten liegen nur auf dem iPhone, nicht auf dem Server. Exportiere ab und zu ein Backup
(Mehr → Backup exportieren → in iCloud Drive sichern).

## Kosten Claude

Nur für den optionalen KI-Wochen-Check: ca. 5–10 Cent pro Check. Alles andere läuft ohne KI und ohne Kosten.

## Dateien

| Datei | Inhalt |
|---|---|
| `js/exercises.js` | Übungsdatenbank (Equipment, Muskeln, Technik, Video-Suche) |
| `js/engine.js` | Split-Vorlagen, Plan-Generator, Progression, Statistiken |
| `js/coach.js` | Optionaler KI-Wochen-Check mit Claude |
| `js/charts.js` | Diagramme |
| `js/app.js` | Oberfläche |
| `sw.js` | Offline-Cache |
| `tools/make_icons.py` | Erzeugt die App-Icons |
| `tools/simulate.js` | Plan-Simulator: spielt je Ziel mehrere Wochen durch und prüft die Planung (im Browser: `(await import('/tools/simulate.js')).runAll()`) |
| `tools/serve.py` | Lokaler Testserver ohne Cache |
