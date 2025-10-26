export class Memory {
  private messages: any[] = [];
  private maxSize: number;

  constructor(maxSize: number = 200) {
    this.maxSize = maxSize;
  }

  push(message: any): void {
    this.messages.push(message);
    // Evtl. Größe begrenzen
    if (this.messages.length > this.maxSize) {
      this.messages = this.messages.slice(-this.maxSize);
    }
  }

  all(): any[] {
    return this.messages;
  }

  size(): number {
    return this.messages.length;
  }

  clear(): void {
    this.messages = [];
  }
}