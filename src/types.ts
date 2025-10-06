export type ToolInput = Record<string, unknown>;

export interface Tool {
  name: string;
  description: string;
  schema?: object; // optional: zod/json-schema
  run: (input: ToolInput) => Promise<unknown>;
}

export interface Step {
  thought: string;
  tool?: string | null;
  // ToolInput plus optionale Felder, die der Planner anhängt
  input?: ToolInput & {
    __tool_output?: unknown;
    __tool_error?: string;
  };
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  name?: string;
  content: string;
}


