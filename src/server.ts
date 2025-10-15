// src/agent/memory.ts
export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export class Memory {
  private messages: ChatMessage[] = [];
  private maxLength: number;

  constructor(maxLength = 200) {
    this.maxLength = maxLength;
  }

  push(msg: ChatMessage): void {
    // einfache Validierung
    if (!msg?.role || typeof msg.content !== 'string') return;
    this.messages.push({ role: msg.role, content: msg.content });

    // Deckelung, damit der Kontext nicht unendlich wächst
    if (this.messages.length > this.maxLength) {
      const overflow = this.messages.length - this.maxLength;
      this.messages.splice(0, overflow);
    }
  }

  all(): ChatMessage[] {
    // Kopie zurückgeben, nicht die interne Referenz
    return [...this.messages];
  }

  clear(): void {
    this.messages.length = 0;
  }

  size(): number {
    return this.messages.length;
  }
}


