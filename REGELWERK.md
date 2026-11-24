# Regelwerk – Trainingsplanung (Muskelaufbau 70 % / Athletik 30 %)

Dieses Dokument ist die wissenschaftliche Grundlage der App. Die Regeln stecken an zwei Stellen:

- `js/engine.js` – lokaler Plan-Generator und Progressionslogik (funktioniert offline)
- `js/coach.js` – Systemprompt für Claude (erstellt Einheiten und Wochen-Checks)

Die Regeln sind Vereinfachungen der Studienlage (Stand Ende 2026). Sie ersetzen keine
ärztliche Abklärung bei Beschwerden.

---

## 1. Muskelaufbau

| Stellgröße | Regel in der App | Grundlage |
|---|---|---|
| Wochenvolumen | 10–20 harte Sätze pro Muskelgruppe/Woche; Start bei ~12, Steigerung im Block | Schoenfeld et al. 2017 (Dosis-Wirkung Volumen); Pelland et al. 2024 (Meta-Regression Volumen & Frequenz) |
| Frequenz | Jede Muskelgruppe 2×/Woche (Ober-/Unterkörper-Split bzw. Ganzkörper) | Schoenfeld, Ogborn & Krieger 2016 (Frequenz-Metaanalyse); Pelland et al. 2024 |
| Intensität | Sätze bis ca. 1–3 Wdh. vor Muskelversagen | Refalo et al. 2023 (Nähe zum Muskelversagen) |
| Wiederholungen | Grundübungen 5–10, Isolation 8–15 (bis 20); breiter Bereich ist gleich wirksam | Schoenfeld et al. 2021 („Repetition Continuum“ neu bewertet) |
| Pausen | Grundübungen 2–3 min, Isolation 60–90 s | Schoenfeld et al. 2016 (längere Satzpausen) |
| Übungsauswahl | Übungen mit Belastung in gedehnter Position bevorzugen (z. B. RDL, Schrägbankdrücken, Overhead-Trizeps, Beinbeuger sitzend) | Maeo et al. 2021/2023 (Training bei langer Muskellänge) |
| Progression | Doppelte Progression (siehe Abschnitt 4) | Gängige Praxis, deckt sich mit Progressive Overload |
| Deload | Nach 4 Belastungswochen 1 Woche mit ~50 % Volumen und ~10 % weniger Gewicht, früher bei Leistungsabfall | Bell et al. 2023 (Delphi-Konsens zum Deloading) |

## 2. Athletik (Schnellkraft, Ausdauer, Mobilität)

| Bereich | Regel in der App | Grundlage |
|---|---|---|
| Schnellkraft | Am Anfang der Einheit (ermüdungsfrei): 3–5 Sätze × 3–5 Wdh. Sprünge, Würfe, Swings oder explosive Hantelvarianten, volle Pause (~2 min) | Sáez de Villarreal et al. 2009 (Plyometrie & Sprunghöhe); Slimani et al. 2016 |
| Kombination Kraft + Ausdauer | Ausdauer stört den Muskelaufbau kaum, die Explosivkraft aber schon, besonders in derselben Einheit → Intervalle nach dem Krafttraining oder an eigenen Tagen, nie davor | Schumann et al. 2022 (Metaanalyse zum Concurrent Training) |
| Ausdauer | 2 Reize/Woche: 1× Intervalle (z. B. 4×4 min oder 6–10×30 s), 1× locker/Zone 2 (20–40 min), sonst als kurzer Finisher | Milanović et al. 2015 (HIIT & VO₂max); Stöggl & Sperlich 2014 (polarisiertes Training) |
| Mobilität | Vor dem Training: dynamisch (RAMP-Aufwärmen). Danach oder separat: statisches Dehnen bzw. Krafttraining über die volle Bewegungsamplitude | Behm et al. 2016 (akute Wirkung von Dehnen); Afonso et al. 2021 (Krafttraining vs. Dehnen für die Beweglichkeit) |

### Nachgetragene Trainings (HIIT, Joggen, Yoga, Kurse, CrossFit, Padel …)

| Regel in der App | Grundlage |
|---|---|
| Last jeder Einheit = Minuten × Anstrengung (leicht 3 / mittel 5 / hart 8) | Session-RPE-Methode, Foster et al. 2001 |
| Hartes Ausdauertraining (oder ≥ 45 min mittel) in den letzten 48 h → kein Ausdauer-Finisher | Interferenz Ausdauer ↔ Explosivkraft, Schumann et al. 2022 |
| Schon ≥ 2 Ausdauer-Reize in dieser Woche → kein Finisher nötig | Ziel ~2 Reize/Woche (s. o.) |
| Harte Beinbelastung (HIIT, Joggen, CrossFit, Padel, Teamsport) in den letzten 48 h → 1 Sprung-Satz weniger | Ermüdung mindert Sprungqualität; Plyometrie braucht Frische |
| Claude sieht alle Trainings der letzten 14 Tage und bewertet die Gesamtlast im Wochen-Check | – |

### Laufeinheit

Beim Sportart-Ziel gelten eigene Regeln: spielnahe kurze Intervalle statt polarisiert (s. 3a, „Sportartspezifisch“).

| Regel in der App | Grundlage |
|---|---|
| Polarisiert: ca. 80 % locker (Zone 2), höchstens 1–2 harte Läufe pro Woche | Stöggl & Sperlich 2014 |
| Automatischer Lauftyp: nach hartem Training (≤ 48 h), nach hartem letzten Lauf (< 4 Tage) oder im Deload → locker; sonst rotierend 4×4, Tempo, 30/30, Sprints, Fahrtspiel | Polarisiertes Training; 4×4-Intervalle als starker VO₂max-Reiz (Helgerud et al. 2007) |
| Laufeinheit = Aufwärmen, Laufen, Dehnen – keine Kraftübungen danach; Kraft für Läufer (einbeinig, Waden, Rumpf, Plyometrie) steckt in den Ganzkörper-Einheiten des Wochenplans | Krafttraining verbessert die Laufökonomie (Balsalobre-Fernández et al. 2016) |
| Läufe zählen als Ausdauerreiz (Session-RPE) und fließen in die Interferenz-Regeln und den Wochen-Check ein | Foster et al. 2001 |

## 3. Aufbau einer Einheit

1. **Aufwärmen & Mobilität** (5–8 min): dynamisch, auf die Einheit abgestimmt
2. **Schnellkraft-Block** (8–12 min): explosiv, wenige Wiederholungen, volle Pausen
3. **Kraft/Hypertrophie** (40–55 min): 1–2 Grundübungen, dann 3–4 Ergänzungs- und Isolationsübungen
4. **Ausdauer-Finisher** (0–12 min): Intervalle oder lockeres Cardio
5. **Cool-down-Mobilität** (3–5 min)

Die Übungen hängen von dem Equipment ab, das du vor dem Training auswählst.

### Bewegungstempo

Jede Kraftübung hat ein Tempo „ablassen – Pause in der Dehnung – zurück“ in Sekunden (X = explosiv, also mit maximal schnell gewollter Bewegung). Wiederholungsdauern von etwa 0,5–8 s bauen ähnlich Muskeln auf (Schoenfeld 2015). Eine maximal schnell gewollte konzentrische Phase bringt mehr Kraft (Pareja-Blanco 2014). Das Tempo wechselt im Block:

| Phase | Grundübungen | Isolation | Schwere Sätze (≤ 6 Wdh.) |
|---|---|---|---|
| Woche 1–2 | 3-1-1 (Technik, Spannung in der Dehnung) | 3-1-1 | 2-1-X (Pausen-Wdh., nicht beim Kreuzheben/Hip Thrust) |
| Woche 3–4 | 2-0-X (mehr Gewicht, explosiv) | 2-1-1 | 2-0-X |
| Deload | 2-0-1 | 2-0-1 | 2-0-1 |

**Ausnahmen:**
- **Waden:** immer 2-2-1. Die Pause unten nimmt den Federeffekt der Achillessehne heraus.
- **Nordic Curls:** so langsam wie möglich ablassen.
- **Schulter-Außenrotation:** 2-0-2.
- **Rumpf- und Landeübungen:** ohne Tempo.
- **Saison (Sportart-Ziel):** keine betonte Exzentrik (2-0-X), um Muskelkater vor Spielen zu vermeiden.

### Supersätze bei wenig Zeit

Passt die Einheit nicht in die gewählte Zeit und das Ziel ist kein Maximalkraft-Ziel, bildet die App **zuerst Gegenspieler-Supersätze**, bevor sie Übungen streicht:
- Paare: Horizontal drücken + horizontal ziehen (A1/A2), vertikal drücken + vertikal ziehen (B1/B2), Bizeps + Trizeps (C1/C2).
- Ablauf: im Wechsel je 1 Satz, dazwischen 90 s Pause bei Grundübungen bzw. 60 s bei Isolation.

Gegenspieler-Supersätze erhalten die Trainingslast bei deutlich kürzerer Dauer und führen langfristig zu ähnlichen Kraft- und Muskelzuwächsen (Robbins 2010, Zhang 2025). Sie sind dafür etwas anstrengender (Puls, Laktat).

**Nie als Supersatz:**
- Beinübungen,
- Sprünge und Sprints,
- schwere Kraftsätze (≤ 6 Wdh., Kraftaufbau, Sportart in Vorbereitung und Saison) – hier sind volle Pausen besser.

Fällt eine Supersatz-Übung später wegen Zeitmangel weg, wird der Partner wieder ein normaler Satz mit normaler Pause.

### Pulszonen

Laufkarten und die Intervall-Uhr zeigen einen Zielpuls. Die Bereiche lassen sich auf vier Arten berechnen (Mehr → Pulszonen):

| Methode | Eingabe | Berechnung |
|---|---|---|
| Aus dem Alter geschätzt (Standard) | – | Max-Puls ≈ 208 − 0,7 × Alter (Tanaka 2001), Abweichung ±10 Schläge |
| Gemessener Max-Puls | Max-Puls | Prozent vom Max-Puls |
| Herzfrequenzreserve (Karvonen 1957) | Max- und Ruhepuls | Ruhepuls + Prozent × (Max − Ruhepuls) |
| Schwellenpuls (Laktatschwelle) | Schwellenpuls aus 30-min-Test (Ø der letzten 20 min, Friel) | Prozent vom Schwellenpuls |

| Bereich | % Max-Puls | % Reserve | % Schwellenpuls | Verwendung |
|---|---|---|---|---|
| Erholung | 60–70 | 50–60 | 70–80 | Trabpausen, Auslaufen |
| Locker (Zone 2) | 65–75 | 60–70 | 78–87 | Dauerlauf, langer Lauf, Einlaufen |
| Schwelle | 85–90 | 80–87 | 95–100 | Tempolauf |
| Intervall (VO₂max) | 90–95 | 87–93 | 100–106 | 4×4 (Helgerud 2007) |

Bei kurzen Intervallen (15/15, 30/30, Sprints) hinkt der Puls hinterher. Dort zählt das Tempo, der Puls steigt erst über die Serie auf etwa 85–95 %.

### Intervall-Uhr

Intervall-Übungen (z. B. 4×4, 30/30, Rad-Sprints, EMOM, wiederholte Sprints, Tempolauf) haben eine Uhr:
- große Anzeige von Belastung, Pause, Serienpause sowie Ein- und Auslaufen,
- Runden vorher anpassbar,
- Signalton 3-2-1 vor jedem Wechsel.

Am Ende wird die Übung abgehakt. Bei Läufen wird die Dauer eingetragen.

## 3a. Trainingsziele

Das Ziel legt fest, welche Einheiten in einer Woche vorkommen (bei z. B. 4 Tagen) und wie trainiert wird:

| Ziel | Woche (4 Tage) | Besonderheiten |
|---|---|---|
| Muskelaufbau & Athletik | 2× Unterkörper, 2× Oberkörper | 70/30, Ausdauer-Finisher, Volumen 10–20 Sätze |
| Kraftaufbau | 2× Unterkörper, 2× Oberkörper | Grundübungen 3–6 Wdh. (Ergänzung 5–8), 2,5–3,5 min Pause, kein Finisher |
| Ausdauer aufbauen | 2 × Lauf, 2 × Ganzkörper | Polarisiert, Kraft mit ~65 % Volumen zum Erhalt |
| Marathon-Vorbereitung | 3 × Lauf, 1 × Ganzkörper | Wöchentlicher langer Lauf (auch im Deload, dann kürzer), Tempo/Intervalle, Kraft kurz (~60 % Volumen); Tapering in den letzten 14 Tagen (−30 % Volumen, kein langer Lauf ab 10 Tagen, nur locker ab 3 Tagen) |
| HYROX | 2 × Ganzkörper, 1 × Lauf, 1 × HYROX | HYROX-Einheit: 1-km-Läufe im Wechsel mit Stationen (Compromised Running), alle 8 Stationen rotieren, Kraft ~70 % Volumen, Tapering vor dem Wettkampf |
| Allgemeine Fitness | 3 × Ganzkörper, 1 × Lauf | Moderates Volumen (~90 %, Ziel ≥ 6 Sätze/Muskel), Läufe abwechselnd locker und fordernd |
| Sportartspezifisch | je nach Saisonphase (s. u.) | Sportart (Fußball, Handball, Basketball, Volleyball, Tennis/Padel), Saisonphase und optional fester Spieltag |
| Abnehmen | 3 × Ganzkörper, 1 × Lauf | Krafttraining bleibt (Muskelerhalt im Kaloriendefizit, ~85 % Volumen), Läufe überwiegend locker + Intervalle, Finisher; optionales Zielgewicht, angestrebtes Tempo 0,5–1 % Körpergewicht pro Woche (Anzeige im Fortschritt), Hinweise zu Alltagsbewegung und Protein (1,6–2,2 g/kg) über Claude |

Hinweise: Bei 5–6 Tagen ergänzen Athletik- bzw. Regenerationstage den Plan, damit die 48-h-Regel einhaltbar bleibt. Mit nur 2 Tagen sind ca. 6–9 Sätze pro Muskel und Woche realistisch (wirksam, aber unter dem Optimum).

### Sportartspezifisch

Teamtrainings und Spiele werden nachgetragen („Teamtraining“, „Spiel / Match“) und zählen zur Belastung (Beine, Ausdauer). Die App plant die Athletik drumherum:

| Saisonphase | Woche (4 Tage) | Besonderheiten |
|---|---|---|
| Vorbereitung | Unterkörper Sport, Oberkörper Sport, Speed & Spielausdauer, Oberkörper Sport | Grundübungen schwer (3–6 Wdh., 2 Wdh. Reserve), ~80 % Volumen, Sprünge/Sprints/Richtungswechsel mit vollen Pausen, wiederholte Sprints als Spielausdauer |
| Saison | Unterkörper Sport, Oberkörper Sport, Speed & Spielausdauer, Regeneration | Erhalt: 2–3 Sätze pro Übung (~60 % Volumen), schwer, 3 Wdh. Reserve, kein Muskelversagen, kein Finisher (Teamtraining deckt Ausdauer ab). Bei 2 Tagen genügen Unter- und Oberkörper – schon 1 Krafteinheit pro Woche erhält Kraft und Sprint in der Saison (Rønnestad 2011) |
| Saisonpause | wie Muskelaufbau (2× Unterkörper, 2× Oberkörper), ab 5 Tagen + Speed | Hypertrophie, volles Volumen, Finisher; Prävention läuft weiter |

**Spieltag** (fester Wochentag und/oder nachgetragenes Spiel, nicht in der Saisonpause):
- Spieltag (MD) und Tag danach (MD+1): Regeneration – am Spieltag nur Mobilität, danach locker + Mobilität.
- Tag vor dem Spiel (MD-1): **Aktivierung** (~30 min): 2–3 Sätze à 2–3 explosive Sprünge/Antritte, volle Pausen, kein Ausdauerteil, kein Muskelkater.
- Zwei Tage vorher (MD-2): keine Einheit, die die Beine ermüdet – Oberkörper oder locker.
- Schwere Beine also an MD-3 oder früher – Kraft- und Schnelligkeitsreize so legen, dass sie bis zum Spiel verarbeitet sind.

**Aufbau der Sport-Einheiten:** Sprints, Sprünge und Richtungswechsel zuerst (ausgeruht, Qualität vor Menge), dann Grundübungen, einbeinige Übungen und Prävention. Bei „Speed & Spielausdauer“ kommen die wiederholten Sprints (z. B. 2–3 × 6 × 20–30 m, 20 s Pause) direkt nach den Drills und **vor** Nordic Curls – nie mit ermüdeten Beinbeugern sprinten.

**Je Sportart** (Reihenfolge der Übungsauswahl und Gewichtung):

| Sportart | Schwerpunkte | Prävention |
|---|---|---|
| Fußball | Antritt, wiederholte Sprints, Richtungswechsel (5-0-5), Weit-/Seitsprünge, Rotationswurf | Nordic Hamstring Curls in allen Einheiten (halbiert die Rate an Beinbeugerverletzungen, van Dyk 2019; van der Horst 2015), Copenhagen Plank (−41 % Leistenprobleme, Harøy 2019), Landetechnik und Gleichgewicht (FIFA 11+, Soligard 2008) |
| Handball | Überkopf- und Rotationswürfe, Strecksprung, seitliche Schnelligkeit | Schulter-Außenrotation (3 Sätze, hohe Priorität; −28 % Schulterprobleme, Andersson 2017), Landetechnik, Nordic Curls |
| Basketball | Sprung mit Anlauf, Niedersprung (reaktiv), seitliche Schritte + Antritt | Landetechnik/Kniekontrolle (Kreuzband, Hewett 1999), Gleichgewicht/Sprunggelenk (McGuine & Keene 2006), Waden |
| Volleyball | Anlauf- und Strecksprung, Überkopfwurf, Slams | Schulter-Außenrotation, Landetechnik, Sprunggelenk |
| Tennis / Padel | Rotationswürfe, Seitsprünge, Pogo-Sprünge, Anti-Rotation | Schulter-Außenrotation |

**Laufeinheiten je Sportart:** Teamsport und Rückschlagsport sind intermittierend: kurze, intensive Belastungen mit vielen Antritten und Wenden. Deshalb plant die App hier **nicht polarisiert** wie im Ausdauersport, sondern spielnahe kurze Intervalle (Buchheit & Laursen 2013; wiederholte Sprints: Bishop 2011):
- **15/15:** 2 × 12 × 15 s schnell (ca. 100–110 % des Tempos, das man 6 min durchhält) / 15 s traben.
- **Wiederholte Sprints mit Richtungswechsel:** 3 × 6 × (15 m + Wende + 15 m), 20 s Pause.
- **Pendelintervalle:** 2 × 10 × 20 s hin und her über 20 m, 20 s Pause.

| Sportart | Vorbereitung | Saison | Saisonpause |
|---|---|---|---|
| Fußball | 4×4, 15/15, wiederholte Sprints, 4×4, Sprints | 15/15, wiederholte Sprints, Sprints | 4×4, Fahrtspiel, Tempolauf |
| Handball | 15/15, wiederholte Sprints, 4×4, Pendeln | 15/15, wiederholte Sprints, Pendeln | 4×4, Fahrtspiel, 15/15 |
| Basketball | 15/15, Pendeln, wiederholte Sprints, 4×4 | wiederholte Sprints, 15/15, Pendeln | 4×4, Fahrtspiel, 15/15 |
| Volleyball | Sprints, wiederholte Sprints, 15/15 | Sprints, wiederholte Sprints | Fahrtspiel, 15/15, 4×4 |
| Tennis / Padel | Pendeln, 15/15, 4×4, wiederholte Sprints | Pendeln, 15/15, Sprints | 4×4, Fahrtspiel, Pendeln |

**Lockerer Lauf** nur zur Erholung:
- am Spieltag, 1–2 Tage vor dem Spiel und am Tag danach,
- am Tag nach hartem Teamtraining oder Spiel – zwischen zwei harten Einheiten liegt ein Ruhetag,
- im Deload,
- wenn das Wochenlimit harter Läufe erreicht ist: Saison 1, Vorbereitung und Pause 2. Teamtraining und Spiel liefern bereits viel intensive Belastung.

Plyometrie verbessert bei Teamsportlern Sprung, Sprint und Richtungswechsel (Slimani 2016); höhere Maximalkraft geht mit besserem Sprint und Sprung einher (Seitz 2014, Suchomel 2016). 4×4-Intervalle verbessern bei Fußballern VO₂max und Laufleistung im Spiel (Helgerud 2001).

Kraft vor Ausdauer-Zielen: Krafttraining verbessert die Laufökonomie (Balsalobre-Fernández et al. 2016) und wird deshalb auch bei Lauf-Zielen beibehalten.

## 3b. Welche Einheit heute? (Stern ★)

Keine feste Reihenfolge – die App empfiehlt jedes Mal neu:

1. **Erholung:** Eine Körperregion (Unter-/Oberkörper) wird frühestens nach ~48 h wieder hart trainiert – auch dann nicht, wenn eine Einheit dieser Region im Wochenplan noch fehlt (dann erholte Einheit oder locker). Nachgetragene Beinbelastung (HIIT, Joggen, Padel …) zählt für den Unterkörper mit; bei Lauf-Zielen zählt ein Lauf nur 24 h („harte Tage hart, lockere Tage locker“), beim Sportart-Ziel Teamtraining und Läufe ebenfalls 24 h (ein Spiel 48 h). Athletik-Tage belasten nur die Beine, Regenerationstage gar nicht.
2. **Wochenplan des Ziels:** Einheiten, die diese Woche laut Ziel noch fehlen (z. B. der 3. Lauf beim Marathon), bekommen Vorrang. Bei Muskel-/Kraft-/Fitness-Zielen zählen zusätzlich Muskeln unter 10 Sätzen in den letzten 7 Tagen.
3. **Abwechslung:** Unter- und Oberkörper (bzw. Ganzkörper) haben je zwei bis drei Varianten, z. B. Unterkörper mit Kniebeuge- oder Hüft-Schwerpunkt. In der Auswahl steht nur „Unterkörper“ bzw. „Oberkörper“; die App wählt die fällige Variante selbst.
4. **Schlüsseleinheit:** Bei Gleichstand gewinnt die Kerneinheit des Ziels (HYROX-Einheit bzw. Lauf beim Marathon).
5. **Alles noch müde?** Dann empfiehlt die App eine lockere Laufeinheit (aktive Erholung) bzw. den Regenerationstag.
6. **Wettkampfwoche:** In den letzten 3 Tagen vor dem Wettkampf nur noch kurz locker laufen oder Pause.
7. **Spieltag (Sportart-Ziel):** Spieltag und Tag danach Regeneration, Tag vorher Aktivierung, zwei Tage vorher keine schweren Beine (s. 3a). Die Spieltag-Regel hat Vorrang vor dem Wochenplan.

Geprüft mit `tools/simulate.js`: alle Ziele inkl. Sportart (3 Saisonphasen, mit und ohne Spieltag) × 2–6 Trainingstage × 3 Startbedingungen über je 8 Wochen (inkl. Deload und Tapering) – alle Prüfungen bestanden.

## 4. Anpassung (die „lernende“ Komponente)

Du trägst nur **Gewicht und Wiederholungen** ein. Daraus leitet die App ab:

- **Doppelte Progression pro Übung:** Hast du in allen Sätzen das obere Ende des
  Wiederholungsbereichs erreicht, steigt das Gewicht beim nächsten Mal
  (Langhantel +2,5 kg, Kurzhantel/Kabel +1–2 kg). Liegst du unter dem unteren Ende,
  bleibt das Gewicht gleich; passiert das zweimal in Folge, sinkt es um ~5 %.
- **Geschätztes 1RM** (Epley-Formel) für jede Übung, das zeigt deinen Trend im Fortschritt-Tab.
- **Richtwerte in kg** für jede Hantelübung:
  1. Übung schon gemacht → Fortschreibung deiner letzten Gewichte (doppelte Progression, s. o.).
  2. Neue Übung → Hochrechnung aus deinen bisherigen Leistungen: persönlicher Kraftfaktor (Median der letzten 1RM-Schätzungen im Verhältnis zu Referenzwerten, bevorzugt gleiche Körperregion) × Referenzwert der neuen Übung.
  3. Noch keine Daten → Referenzwert × Körpergewicht × Kraftniveau (Einsteiger 0,6 / Grundlagen 0,8 / Fortgeschritten 1,0 / Stark 1,13 / Sehr stark 1,27 / Elite 1,4 – entspricht einer Kniebeuge von ca. 0,9 / 1,2 / 1,5 / 1,7 / 1,9 / 2,1 × Körpergewicht bei Männern, Frauen ca. 30 % weniger) × Geschlecht. Ist das Körperfett bekannt, zählt statt des Körpergewichts die fettfreie Masse (Referenz ≈ 15 % Körperfett, Faktor 0,8–1,1).
  Aus dem geschätzten 1RM wird das Arbeitsgewicht für die Mitte des Wdh.-Bereichs plus Wdh. in Reserve berechnet (Epley): Muskel-/Kraft-/Fitness-Ziele 2, Ausdauer-/Marathon-/HYROX-Ziele 3 Wdh. Reserve. Kraftaufbau nutzt 3–6 Wdh. → höhere Gewichte. Deload −10 %.
- **Eintragen:** Ein Satz zählt, sobald Wdh. (und bei Hantelübungen das Gewicht) eingetragen sind – Abhaken ist optional.
- **Stagnation:** Bleibt das geschätzte 1RM über 3 Einheiten derselben Übung
  gleich oder sinkt, schlägt die App eine Variante vor.
- **Block-Periodisierung:** Woche 1–4 Belastung, das Volumen steigt von Woche zu Woche
  (+1 Satz bei den Hauptübungen ab Woche 3). Woche 5 ist der Deload.
- **Wochen-Check mit Claude:** Claude wertet Volumen pro Muskel, Leistungstrends und
  Körpergewicht aus und gibt Anpassungen (± Sätze pro Muskel, Fokus, Deload).
  Diese fließen in jede weitere Planung ein.

## 5. Rekorde & Rückmeldung nach dem Training

- **Rekorde:** Beim Abschließen vergleicht die App jede Übung mit allen früheren Einheiten – höheres geschätztes 1RM (Epley) oder schwerster Satz, beim Laufen längste Strecke und schnellste Pace (ab 3 km). Rekorde werden gefeiert, im Verlauf markiert und im Fortschritt gelistet.
- **Belastung automatisch:** Aus den eingetragenen Wdh. – ≥ 50 % der Kraftsätze unter dem Wdh.-Ziel = zu schwer → nächste Einheit 1 Satz weniger pro Übung, kein Finisher, nächster Lauf locker; zweimal innerhalb kurzer Zeit → Deload-Charakter (−10 % Gewicht). ≥ 80 % am oberen Ende = zu leicht → Hauptübungen +1 Satz.
- **Beschwerden:** Knie, Schulter, Rücken, Ellbogen, Hüfte, Sprunggelenk. Belastende Übungen werden 7 Tage lang ersetzt oder weggelassen, auch Sprint- und Sprung-Finisher. Bei Knie, Hüfte oder Sprunggelenk schlägt die App nur lockere Läufe vor oder Radfahren. Zusätzliche Übungen für die betroffene Region nimmt die App bisher nicht auf.
- **Keine Doppelungen:** Jede Übung und jede Variante kommt höchstens einmal pro Einheit vor (z. B. nicht Liegestütze und Enge Liegestütze). Die Hauptübung wird zuerst gewählt. Auch Claude-Pläne werden so bereinigt, und Supersätze bestehen immer aus zwei verschiedenen Übungen.
- **Kurze Umfrage:** „Hat es dir gefallen?“ (bei „nein“: nächstes Mal andere Varianten dieser Einheit, einzelne Übungen dauerhaft ausblendbar) und „Beschwerden?“ (Knie, Schulter, Rücken, Ellbogen, Hüfte → belastende Übungen 7 Tage lang ersetzt bzw. weggelassen; Hinweis auf ärztliche Abklärung bei anhaltenden Schmerzen).
- Claude bekommt Belastung, Gefallen und Beschwerden der letzten Einheiten; ausgeblendete und schmerzauslösende Übungen sind aus seinem Übungskatalog entfernt.

## 6. Körperzusammensetzung (optional)

Zum Gewicht können **Muskelmasse (kg)** und **Körperfett (%)** eingetragen werden, z. B. von einer Körperanalyse-Waage. Solche Waagen schwanken von Tag zu Tag deutlich. Die App wertet deshalb nur Mittelwerte und Trends aus: die Messungen der letzten 10 Tage gegen die von vor 3–8 Wochen. Messungen, die älter als 3 Wochen sind, ändern den Plan nicht.

| Befund | Anpassung |
|---|---|
| Muskelmasse ≥ 0,5 kg gesunken | Hauptübungen +1 Satz, kein intensiver Finisher; Hinweis: Defizit verkleinern, Protein 1,6–2,2 g/kg (Morton 2018) |
| Körperfett ≥ 1 %-Punkt gestiegen ohne Muskelzuwachs (Aufbau-Ziele) | Ausdauer-Finisher dazu (auch beim Kraftaufbau), Kalorienüberschuss um ca. 200–300 kcal senken |
| Körperfett steigt beim Ziel Abnehmen | Hinweis: Defizit und Alltagsbewegung prüfen |
| Fett ↓ bei stabiler Muskelmasse | Rückmeldung „Rekomposition läuft“, keine Änderung |
| Körperfett hoch (Männer > 25 %, Frauen > 32 %) bei Aufbau-Zielen | Finisher, Aufbau ohne Überschuss (Rekomposition) |
| Körperfett niedrig (Männer < 10 %, Frauen < 18 %) beim Abnehmen | kein intensiver Finisher, nur noch langsam abnehmen |

Claude bekommt die Werte und Trends für Planung und Wochen-Check.

## Quellen

- Afonso J. et al. (2021). Strength Training versus Stretching for Improving Range of Motion: A Systematic Review and Meta-Analysis. *Healthcare*.
- Andersson S.H. et al. (2017). Preventing overuse shoulder injuries among throwing athletes: a cluster-randomised controlled trial in 660 elite handball players. *Br J Sports Med*.
- Balsalobre-Fernández C., Santos-Concejero J., Grivas G.V. (2016). Effects of Strength Training on Running Economy in Highly Trained Runners: A Systematic Review With Meta-Analysis of Controlled Trials. *J Strength Cond Res*.
- Behm D.G. et al. (2016). Acute effects of muscle stretching on physical performance, range of motion, and injury incidence. *Appl Physiol Nutr Metab*.
- Bell L. et al. (2023). Integrating Deloading into Strength and Physique Sports Training Programmes: An International Delphi Consensus Approach. *Sports Medicine – Open*.
- Bishop D., Girard O., Mendez-Villanueva A. (2011). Repeated-Sprint Ability – Part II: Recommendations for Training. *Sports Medicine*.
- Buchheit M., Laursen P.B. (2013). High-Intensity Interval Training, Solutions to the Programming Puzzle. Part I & II. *Sports Medicine*.
- van Dyk N., Behan F.P., Whiteley R. (2019). Including the Nordic hamstring exercise in injury prevention programmes halves the rate of hamstring injuries: a systematic review and meta-analysis of 8459 athletes. *Br J Sports Med*.
- Foster C. et al. (2001). A New Approach to Monitoring Exercise Training. *J Strength Cond Res*.
- Friel J. (2009). *The Triathlete's Training Bible* (Schwellenpuls-Test und -Zonen). VeloPress.
- Harøy J. et al. (2019). The Adductor Strengthening Programme prevents groin problems among male football players: a cluster-randomised controlled trial. *Br J Sports Med*.
- Helgerud J. et al. (2001). Aerobic endurance training improves soccer performance. *Med Sci Sports Exerc*.
- Helgerud J. et al. (2007). Aerobic High-Intensity Intervals Improve VO₂max More Than Moderate Training. *Med Sci Sports Exerc*.
- Hewett T.E. et al. (1999). The effect of neuromuscular training on the incidence of knee injury in female athletes. *Am J Sports Med*.
- van der Horst N. et al. (2015). The Preventive Effect of the Nordic Hamstring Exercise on Hamstring Injuries in Amateur Soccer Players: A Randomized Controlled Trial. *Am J Sports Med*.
- Karvonen M.J., Kentala E., Mustala O. (1957). The effects of training on heart rate; a longitudinal study. *Ann Med Exp Biol Fenn*.
- Maeo S. et al. (2021). Greater Hamstrings Muscle Hypertrophy but Similar Damage Protection after Training at Long versus Short Muscle Lengths. *Med Sci Sports Exerc*.
- McGuine T.A., Keene J.S. (2006). The effect of a balance training program on the risk of ankle sprains in high school athletes. *Am J Sports Med*.
- Milanović Z., Sporiš G., Weston M. (2015). Effectiveness of High-Intensity Interval Training and Continuous Endurance Training for VO₂max Improvements. *Sports Medicine*.
- Morton R.W. et al. (2018). A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. *Br J Sports Med*.
- Pareja-Blanco F. et al. (2014). Effect of movement velocity during resistance training on neuromuscular performance. *Int J Sports Med*.
- Pelland J. et al. (2024). The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gain. *SportRxiv (Preprint)*.
- Refalo M.C. et al. (2023). Influence of Resistance Training Proximity-to-Failure on Skeletal Muscle Hypertrophy. *Sports Medicine*.
- Robbins D.W. et al. (2010). Agonist–antagonist paired set resistance training: a brief review. *J Strength Cond Res*.
- Rønnestad B.R. et al. (2011). In-season strength maintenance training increases well-trained soccer players' performance. *J Strength Cond Res*.
- Sáez de Villarreal E. et al. (2009). Determining variables of plyometric training for improving vertical jump height performance: a meta-analysis. *J Strength Cond Res*.
- Schoenfeld B.J. et al. (2016). Longer interset rest periods enhance muscle strength and hypertrophy in resistance-trained men. *J Strength Cond Res*.
- Schoenfeld B.J. et al. (2021). Loading Recommendations for Muscle Strength, Hypertrophy, and Local Endurance: A Re-Examination of the Repetition Continuum. *Sports*.
- Schoenfeld B.J., Ogborn D., Krieger J.W. (2016). Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy. *Sports Medicine*.
- Schoenfeld B.J., Ogborn D., Krieger J.W. (2017). Dose-response relationship between weekly resistance training volume and increases in muscle mass. *J Sports Sci*.
- Schoenfeld B.J., Ogborn D.I., Krieger J.W. (2015). Effect of repetition duration during resistance training on muscle hypertrophy: a systematic review and meta-analysis. *Sports Medicine*.
- Schumann M. et al. (2022). Compatibility of Concurrent Aerobic and Strength Training for Skeletal Muscle Size and Function: An Updated Systematic Review and Meta-Analysis. *Sports Medicine*.
- Seitz L.B. et al. (2014). Increases in lower-body strength transfer positively to sprint performance: a systematic review with meta-analysis. *Sports Medicine*.
- Slimani M. et al. (2016). Effects of Plyometric Training on Physical Fitness in Team Sport Athletes: A Systematic Review. *J Hum Kinet*.
- Soligard T. et al. (2008). Comprehensive warm-up programme to prevent injuries in young female footballers: cluster randomised controlled trial. *BMJ*.
- Stöggl T., Sperlich B. (2014). Polarized training has greater impact on key endurance variables than threshold, high intensity, or high volume training. *Front Physiol*.
- Suchomel T.J., Nimphius S., Stone M.H. (2016). The Importance of Muscular Strength in Athletic Performance. *Sports Medicine*.
- Tanaka H., Monahan K.D., Seals D.R. (2001). Age-predicted maximal heart rate revisited. *J Am Coll Cardiol*.
- Zhang X. et al. (2025). Superset Versus Traditional Resistance Training Prescriptions: A Systematic Review and Meta-analysis Exploring Acute and Chronic Effects on Mechanical, Metabolic, and Perceptual Variables. *Sports Medicine*.
