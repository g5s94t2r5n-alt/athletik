# Athletik – Trainings-App für iPhone

Web-App (PWA) für Muskelaufbau (70 %) und Athletik (30 %: Schnellkraft, Ausdauer, Mobilität).
Läuft vom iPhone-Homescreen wie eine normale App, auch offline im Gym. Kein App Store, kein Xcode nötig.

## Funktionen

- **Equipment vor jedem Training wählen** (oder Preset: Studio, Home-Gym, Hotel, Körpergewicht, Draußen) → passender Plan
- **Planung mit Claude** (Opus 5.5) inkl. Wunsch/Befinden des Tages – oder offline mit der eingebauten Regel-Logik
- **Richtwerte in kg** für jede Übung – aus deinen letzten Gewichten, passend zum Trainingsziel
- **Automatische Progression** aus Gewicht × Wiederholungen (doppelte Progression, Deload alle 5 Wochen, Übungswechsel bei Stagnation)
- **Wochen-Check mit Claude**: passt Sätze pro Muskel, Fokus und Übungsauswahl an
- **Andere Trainings nachtragen** (HIIT, Joggen, Yoga, Kurse, CrossFit, Padel, Paddeln, Radfahren …) mit Dauer, Anstrengung und optional Strecke. Sie fließen in die Planung ein (z. B. kein Ausdauer-Finisher nach hartem HIIT gestern) und in den Wochen-Check
- **Diagramme**: Körpergewicht (mit 7-Tage-Mittel und optionalem Zielgewicht), Kraftentwicklung je Übung (geschätztes 1RM), Wochenvolumen pro Muskel, Monatsübersicht im Verlauf (wie oft welche Einheit)
- **Trainingsziele**: Muskelaufbau & Athletik, Kraftaufbau, Ausdauer, Marathon, HYROX, Allgemeine Fitness, Abnehmen
- **Videos & Technik**: Technikhinweise zu jeder Übung, YouTube-Suche mit einem Tipp, eigene Videos speichern und direkt in der App abspielen
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
3. App vom Homescreen starten → Mehr → Claude-API-Key eintragen (console.anthropic.com)

Deine Trainingsdaten liegen nur auf dem iPhone, nicht auf dem Server. Exportiere ab und zu ein Backup
(Mehr → Backup exportieren → in iCloud Drive sichern).

## Kosten Claude

Pro geplanter Einheit ca. 5–10 Cent, pro Wochen-Check ähnlich. Ohne API-Key läuft alles mit der Regel-Logik.

## Dateien

| Datei | Inhalt |
|---|---|
| `js/exercises.js` | Übungsdatenbank (Equipment, Muskeln, Technik, Video-Suche) |
| `js/engine.js` | Split-Vorlagen, Plan-Generator, Progression, Statistiken |
| `js/coach.js` | Claude-Anbindung (Einheit planen, Wochen-Check) |
| `js/charts.js` | Diagramme |
| `js/app.js` | Oberfläche |
| `sw.js` | Offline-Cache |
| `tools/make_icons.py` | Erzeugt die App-Icons |
| `tools/simulate.js` | Plan-Simulator: spielt je Ziel mehrere Wochen durch und prüft die Planung (im Browser: `(await import('/tools/simulate.js')).runAll()`) |
| `tools/serve.py` | Lokaler Testserver ohne Cache |
