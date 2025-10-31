# Die Stämme – FarmGod & FarmGod Test  
**Automatisiertes Farming für [Die Stämme](https://www.die-staemme.de)**  

![Die Stämme](https://upload.wikimedia.org/wikipedia/de/b/ba/Die_St%C3%A4mme_Logo.png)

*Effizientes, regelkonformes Farming – mit smarter Zielsuche und Truppenoptimierung.*

---

## 📌 Über das Projekt

Dieses Repository enthält zwei leistungsstarke Farming-Tools für **Die Stämme** (Tribal Wars):

- **`FarmGod`** – Der **klassische, zuverlässige Farming-Bot**  
- **`FarmGod Test`** – Die **erweiterte Version mit automatischer Barbarendorf-Suche**

Beide Tools helfen dir, inaktive Dörfer effizient zu farmen, Ressourcen zu maximieren und deine Truppen intelligent einzusetzen.

> **Wichtig**: Nutzung auf eigene Verantwortung. Die Skripte sind für **Bildungszwecke** gedacht.
> Respektiere die [Nutzungsbedingungen von Die Stämme](https://www.die-staemme.de/page/rules).

---

## 🚀 Funktionen im Vergleich

| Funktion | **FarmGod** | **FarmGod Test** |
|--------|-------------|------------------|
| Farming aus gewählten Dorfgruppen | ✅ | ✅ |
| Maximale Felder-Distanz (z. B. 20) | ✅ | ✅ |
| Pausen zwischen Angriffen (z. B. 10 Min.) | ✅ | ✅ |
| Farming auch bei Teil-Verlusten | ✅ | ✅ |
| B-Vorlage bei voller Beute | ✅ | ✅ |
| **Automatisches Hinzufügen neuer Barbarendörfer** | ❌ | ✅ |
| Automatisches Senden nach Planung | ✅ | ✅ |

---

## ⚙️ Einstellungen – Erklärung

### **Gemeinsame Optionen** (beide Versionen)
| Option | Funktion |
|-------|---------|
| **Farms aus Gruppe senden** | Wähle, welche deiner Dorfgruppen farmen sollen (z. B. „alle“). |
| **Maximale Felder-Distanz** | Nur Dörfer innerhalb dieser Reichweite werden angegriffen (z. B. 20 Felder). |
| **Abstand zwischen Angriffen** | Mindestwartezeit zwischen zwei Angriffen (z. B. 10 Minuten). |
| **Auch bei teilweisen Verlusten farmen** | Angriffe werden auch gesendet, wenn nicht alle Truppen überlebt haben. |
| **B-Vorlage senden, wenn letzte Beute voll war** | Nutzt eine stärkere Truppenvorlage (B), wenn das letzte Ziel voll war. |
| **Nach dem Planen automatisch senden** | Startet das Farming sofort nach der Planung – kein manuelles Klicken nötig. |

### **Nur in FarmGod Test**
| Option | Funktion |
|-------|---------|
| **Neue Barbarendörfer zum Farmen hinzufügen** | **Automatisch neue Barbarendörfer finden und in die Farm-Liste aufnehmen** – ideal für wachsende Welten oder neue Kontinente. |

---

## 🛠️ Installation & Nutzung

 ## **`Farmgod:`**
 Name | Eingabe |
|-------|---------|
| **Name des Eintrags:** | Frei Wählbar |
| **Hovertext** | Frei Wählbar |
| **Bild-URL** | Frei Wählbar |
| **Ziel-URL** | javascript: $.getScript('https://heiko1988.github.io/ds/FarmGod.js?v='+(Date.now()));


## **`Farmgod Test: `**
 Name | Eingabe |
|-------|---------|
| **Name des Eintrags:** | Frei Wählbar |
| **Hovertext** | Frei Wählbar |
| **Bild-URL** | Frei Wählbar |
| **Ziel-URL** | javascript: $.getScript('https://heiko1988.github.io/ds/farmgod_test.js?v='+(Date.now()));

