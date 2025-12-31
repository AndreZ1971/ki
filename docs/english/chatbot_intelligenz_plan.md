# Plan for a Maximally Intelligent Shop Chatbot

## Goal

- The chatbot should answer all questions about the shop, system, products, orders, customers, system health, etc. in a context-aware, dynamic, and intelligent manner.
- OpenAI (GPT-4/4o) is used for generative, natural language processing.
- Shop data and system status are dynamically fetched from the database/API and integrated into the prompts.
- Greeting remains individually configurable.

---

## Architecture Plan

1. **Frontend**
   - Chatbot components (FloatingChatbot, ChatbotWidget) remain as before, sending user questions to the backend.
   - Optional: Send context (e.g., current page, user role).

2. **Backend**
   - Route `/api/chatbot/message` accepts question, history, and context.
   - Backend detects whether shop/system data is needed (e.g., "How many orders today?").
   - Fetches relevant data (WooCommerce, System API, own DB).
   - Creates a prompt for OpenAI that combines shop data, system status, and user question.
   - Calls the OpenAI API (e.g., GPT-4o) and returns the generated response.

3. **OpenAI Prompt Strategy**
   - System Prompt: "You are an AI shop assistant. Answer friendly, precisely and based on the following shop data: ..."
   - User Prompt: Contains the actual question and optionally chat history.
   - Context: Shop name, current sales, product count, system status, etc.

---

## Example Backend Code (Excerpt)

```typescript
// In the backend: routes/app/api/chatbot-message.ts
import { getConfig } from '@config';
import { getShopStats, getSystemHealth } from '../services/shopData';
import { openai } from '../utils/openai';

server.post('/message', async (request, _reply) => {
  const { message, history, userRole, context } = request.body as any;

  // 1. Fetch shop data (e.g., sales, orders, products)
  const stats = await getShopStats();
  const health = await getSystemHealth();

  // 2. Build prompt
  const systemPrompt = `You are an AI shop assistant. Shop name: ${stats.shopName}. Sales today: ${stats.salesToday} EUR. Orders: ${stats.ordersToday}. System status: ${health.status}.`;
  const userPrompt = `Question: ${message}`;

  // 3. Call OpenAI API
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

  const reply = completion.choices[0]?.message?.content || 'Sorry, I could not find anything on that.';
  return { success: true, reply };
});
```

---

## Example: shopData.ts (Fetch Shop and System Data)

```typescript
export async function getShopStats() {
  // Query WooCommerce API or DB
  return {
    shopName: 'My Shop',
    salesToday: 1234.56,
    ordersToday: 12,
    products: 87
  };
}

export async function getSystemHealth() {
  // Query System API
  return {
    status: 'healthy',
    cpu: 23,
    memory: 65
  };
}
```

---

## Notes

- The greeting remains configurable in the frontend.
- The bot can respond differently for different roles (admin, customer) (via userRole in the prompt).
- For SystemHealth, a special prompt can be used: "You are a monitoring assistant..."
- Data Protection: Do not provide sensitive customer data without authorization!

---

## Extensions

- Integrate FAQ and documentation database
- Use context from the current page/session
- Feedback and learning function for the bot

---

---
Created on 22.12.2025 by GitHub Copilot (GPT-4.1)
