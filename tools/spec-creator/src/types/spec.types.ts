export interface Feature {
  id: string
  name: string
  description: string
}

export interface ARISpec {
  name: string
  id: string
  version: string
  category: string
  icon: string
  description: string
  systemPrompt: string
  features: Feature[]
  metadata?: {
    createdAt: string
    author: string
  }
}

export interface FormData {
  name: string
  id: string
  version: string
  category: string
  icon: string
  description: string
  systemPrompt: string
  features: Feature[]
}

export type StepType = 'info' | 'system' | 'features' | 'preview'
