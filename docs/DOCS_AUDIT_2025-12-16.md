# Dokumentations-Audit (Stand: 2025-12-16)

Ziel: Veraltete, doppelte und nicht benötigte Dokumente identifizieren; notwendige aktualisieren.

## Kategorien
- Aktuell: Inhalt deckt implementierten Stand ab, Datum vorhanden.
- Aktualisieren: Teilweise veraltet, aber relevant → kurzer Update-Plan.
- Konsolidieren: Überschneidungen → zusammenführen.
- Archivieren: Stark veraltet/nicht mehr benötigt → in `docs/archive/` verschieben.

## Ergebnisse (Kurzfassung)
- Aktuell:
  - `architecture.md` (Header aktualisiert, Status aktuell)
  - `VOICE_NEXT_STEP.md` (SEHR WICHTIG)
  - `Troubleshooting.md`
  - `DEPLOY_SUPPORT.md`
  - `HETZNER_DEPLOYMENT.md`
  - `SOCIAL_MEDIA_GUIDE.md` (neu, konsolidiert)
  - `ZAPIER_SETUP.md`, `IFTTT_SETUP.md`
  - `ml-integration.md` (Baseline Features)
- Aktualisieren:
  - `BACKEND_AI_SETUP.md` (Ton/Marketing-lastig, Struktur ok → Datenpfade auf heutige Routen verweisen)
  - `analytics-ml-ki-analyse.md` (Teile als Roadmap aktualisieren; KI-Teile teils umgesetzt)
  - `MAKE_SETUP.md` (prüfen auf aktuelle Schrittfolgen)
  - `deployment.md` (vereinheitlichen mit `DEPLOY_SUPPORT.md`)
- Konsolidieren:
  - `CONTENT_MONETIZATION_API.md` + `CONTENT_MONETIZATION_GUIDE.md` → zusammengelegt zu `CONTENT_MONETIZATION.md` (DONE)
  - `SOCIAL_POSTER_KI_INTEGRATION.md` + `SOCIAL_MEDIA_SETUP.md` → konsolidiert zu `SOCIAL_MEDIA_GUIDE.md` (DONE)
- Archivieren/Kandidat:
  - `deploy.txt` (redundant zu deployment docs)
  - `import fehler.txt` (Einzelnote; Inhalte in Troubleshooting übernehmen)
  - `umschulung.txt` (nicht produktbezogen)

## Konkrete Updates (Next)
1) Aktualisieren: `BACKEND_AI_SETUP.md` Route-Referenzen auf aktuelle Endpunkte
2) Aktualisieren: `analytics-ml-ki-analyse.md` Status/Umsetzungsgrad und neue Trends-Keywords-Endpoint (teilweise erledigt)
3) Vereinheitlichen: `deployment.md` mit `DEPLOY_SUPPORT.md` → Single Source of Truth
4) Archiv prüfen: verbleibende Einzelnotizen sauber verweisen

## Notizen
- Bitte Freigabe für Archivierungen erteilen, dann verschiebe ich Dateien inkl. Querverweise.
