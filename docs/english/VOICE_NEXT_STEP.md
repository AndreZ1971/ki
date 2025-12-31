# SEHR WICHTIG: Next Step Sprachfähigkeit für Ari

Ziel: Ari soll Shop-bezogene Gespräche führen (Frage/Antwort) mit gesprochener Ein- und Ausgabe.

## Minimalplan (MVP)
- Frontend: Push-to-talk Button, Audio-Capture via Web Audio; WebSocket an Backend.
- STT: Streaming (Whisper/Azure Speech/Deepgram) -> Text; VAD zum Auto-Stopp, Timeout bei Stille.
- Chat: Bestehender Chat-Endpoint nutzen, Guardrail-Prompt: "Antwort nur aus Shop-Daten, sonst nachfragen; Stand/Quelle nennen".
- TTS: Neural TTS (Azure/ElevenLabs/PlayHT) als Stream zurück; im Browser via MediaSource/AudioContext abspielen.
- Transport: Duplex-WebSocket; bei Bedarf Fallback SSE + Polling für Audio-URL.

## Guardrails
- Faktentreue: Keine Antwort ohne belegte Shop-Daten; bei fehlenden Fakten explizit sagen.
- Freshness: Antworten mit Timestamp ("Stand: <zeit>"); Cache-TTL für Produkt/Neuheiten.
- Privacy: Keine PII-Ausgabe; Rollen/Scopes für sensitive Endpunkte.
- Limits: Token-/Kosten-Limits; max Antwortlänge; Abbruch bei fehlender Verbindung.

## Eval/Tests
- Testkatalog: Neuheiten, Verfügbarkeit, Preisänderung, Kategorien. Erwartet: Zitat aus Live-Daten oder "nicht vorhanden".
- Audio: Latenz < 2s Ziel, Abbruch/Retry bei Paketverlust; Fallback auf Text.

## Next Actions
1) WS-Endpoint für STT/TTS-Relay anlegen (Backend), bestehende Chat-Logik wiederverwenden.
2) Frontend Push-to-talk + Waveform-Indikator implementieren; Text-Fallback beibehalten.
3) Guardrail-Prompt und "Stand"-Metadatum in Chat-Antworten einbauen.
4) Kleiner Load-Test (5 parallele Sessions) und Kosten-Check je Minute Audio.
