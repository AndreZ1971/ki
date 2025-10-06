export type ToolInput = Record<string, any>;

export interface Tool {
  name: string;
  description: string;
  schema?: object;
  run: (input: ToolInput) => Promise<any>;
}

export interface Step {
  thought: string;
  tool?: string | null;
  input?: ToolInput;
}

export interface AgentMessage {
  role: "system" | "user" | "assistant" | "tool";
  name?: string;
  content: string;
}
