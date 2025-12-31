# Plan für einen maximal intelligenten Shop-Chatbot

## Ziel

- Der Chatbot soll auf alle Fragen zum Shop, System, Produkten, Bestellungen, Kunden, Systemgesundheit etc. kontextbezogen, dynamisch und intelligent antworten.
- OpenAI (GPT-4/4o) wird für generative, natürliche Sprache genutzt.
- Shopdaten und Systemstatus werden dynamisch aus der Datenbank/API geholt und in die Prompts integriert.
- Begrüßung bleibt individuell konfigurierbar.

---

## Architektur-Plan

1. **Frontend**
   - Chatbot-Komponenten (FloatingChatbot, ChatbotWidget) bleiben wie bisher, senden User-Fragen an das Backend.
   - Optional: Kontext (z.B. aktuelle Seite, Userrolle) mitsenden.

2. **Backend**
   - Route `/api/chatbot/message` nimmt Frage, Historie, Kontext entgegen.
   - Backend erkennt, ob Shop-/Systemdaten benötigt werden (z.B. "Wie viele Bestellungen heute?").
   - Holt relevante Daten (WooCommerce, System-API, eigene DB).
   - Erstellt einen Prompt für OpenAI, der Shopdaten, Systemstatus und Userfrage kombiniert.
   - Ruft OpenAI-API (z.B. GPT-4o) auf und gibt die generierte Antwort zurück.

3. **OpenAI Prompt-Strategie**
   - System-Prompt: "Du bist ein KI-Shopassistent. Antworte freundlich, präzise und auf Basis folgender Shopdaten: ..."
   - User-Prompt: Enthält die eigentliche Frage und ggf. Chat-Historie.
   - Kontext: Shopname, aktuelle Umsätze, Produktanzahl, Systemstatus etc.

---

## Beispielcode Backend (Ausschnitt)

```typescript
// Im Backend: routes/app/api/chatbot-message.ts
import { getConfig } from '@config';
import { getShopStats, getSystemHealth } from '../services/shopData';
import { openai } from '../utils/openai';

server.post('/message', async (request, _reply) => {
  const { message, history, userRole, context } = request.body as any;

  // 1. Shopdaten holen (z.B. Umsatz, Orders, Produkte)
  const stats = await getShopStats();
  const health = await getSystemHealth();

  // 2. Prompt bauen
  const systemPrompt = `Du bist ein KI-Shopassistent. Shopname: ${stats.shopName}. Umsatz heute: ${stats.salesToday} EUR. Bestellungen: ${stats.ordersToday}. Systemstatus: ${health.status}.`;
  const userPrompt = `Frage: ${message}`;

  // 3. OpenAI-API aufrufen
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...history.map((m: any) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 400,
    temperature: 0.2
  });

  const reply = completion.choices[0]?.message?.content || 'Entschuldigung, ich konnte dazu nichts finden.';
  return { success: true, reply };
});
```

---

## Beispiel: shopData.ts (Shop- und Systemdaten holen)

```typescript
export async function getShopStats() {
  // WooCommerce-API oder DB abfragen
  return {
    shopName: 'Mein Shop',
    salesToday: 1234.56,
    ordersToday: 12,
    products: 87
  };
}

export async function getSystemHealth() {
  // System-API abfragen
  return {
    status: 'healthy',
    cpu: 23,
    memory: 65
  };
}
```

---

## Hinweise

- Die Begrüßung bleibt im Frontend konfigurierbar.
- Der Bot kann für verschiedene Rollen (Admin, Kunde) unterschiedlich antworten (über userRole im Prompt).
- Für SystemHealth kann ein spezieller Prompt genutzt werden: "Du bist ein Monitoring-Assistent..."
- Datenschutz: Keine sensiblen Kundendaten ohne Berechtigung ausgeben!

---

## Erweiterungen

- FAQ- und Dokumentationsdatenbank einbinden
- Kontext aus der aktuellen Seite/Session nutzen
- Feedback- und Lernfunktion für den Bot

---


---
Erstellt am 22.12.2025 von GitHub Copilot (GPT-4.1)
