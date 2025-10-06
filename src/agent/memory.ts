import type { AgentMessage } from '../types.js';

export class Memory {
  private history: AgentMessage[] = [];
  push(msg: AgentMessage) { this.history.push(msg); }
  all() { return this.history; }
  last(n = 10) { return this.history.slice(-n); }
}
