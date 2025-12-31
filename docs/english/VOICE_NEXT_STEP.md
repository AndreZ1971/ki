# CRITICAL: Next Step Voice Capability for Ari

Goal: Ari should conduct shop-related conversations (question/answer) with spoken input and output.

## Minimal Plan (MVP)
- Frontend: Push-to-talk button, audio capture via Web Audio API; WebSocket to backend
- STT: Streaming (Whisper/Azure Speech/Deepgram) → Text; VAD for auto-stop, timeout on silence
- Chat: Use existing chat endpoint, guardrail prompt: "Answer only from shop data, otherwise ask for clarification; mention source/status"
- TTS: Neural TTS (Azure/ElevenLabs/PlayHT) as stream back; play in browser via MediaSource/AudioContext
- Transport: Duplex WebSocket; fallback to SSE + polling for audio URL if needed

## Guardrails
- Factual Accuracy: No answer without verified shop data; explicitly state when facts are missing
- Freshness: Answers with timestamp ("Status: <time>"); cache TTL for products/news
- Privacy: No PII output; roles/scopes for sensitive endpoints
- Limits: Token/cost limits; max response length; abort on connection loss

## Eval/Tests
- Test Catalog: New products, availability, price changes, categories. Expected: Quote from live data or "not available"
- Audio: Target latency < 2s, abort/retry on packet loss; fallback to text

## Next Actions
1) Create WebSocket endpoint for STT/TTS relay (Backend), reuse existing chat logic
2) Implement frontend push-to-talk + waveform indicator; keep text fallback
3) Add guardrail prompt and "status" metadata to chat responses
4) Small load test (5 parallel sessions) and cost check per minute of audio
