import { ARISpec, FormData } from '../types/spec.types'

export function validateSpec(data: FormData): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required')
  }
  if (data.name && data.name.length > 100) {
    errors.push('Name must be less than 100 characters')
  }

  // Validate ID (kebab-case)
  if (!data.id || data.id.trim().length === 0) {
    errors.push('ID is required')
  }
  if (data.id && !/^[a-z0-9-]+$/.test(data.id)) {
    errors.push('ID must contain only lowercase letters, numbers, and hyphens')
  }
  if (data.id && data.id.length > 50) {
    errors.push('ID must be less than 50 characters')
  }

  // Validate version
  if (!data.version || data.version.trim().length === 0) {
    errors.push('Version is required')
  }
  if (data.version && !/^\d+\.\d+\.\d+/.test(data.version)) {
    errors.push('Version must follow semver format (e.g., 1.0.0)')
  }

  // Validate category
  if (!data.category || data.category.trim().length === 0) {
    errors.push('Category is required')
  }

  // Validate systemPrompt
  if (!data.systemPrompt || data.systemPrompt.trim().length === 0) {
    errors.push('System prompt is required')
  }
  if (data.systemPrompt && data.systemPrompt.length > 5000) {
    errors.push('System prompt must be less than 5000 characters')
  }

  // Validate features
  if (!data.features || data.features.length === 0) {
    errors.push('At least one feature is required')
  }
  data.features?.forEach((feature, index) => {
    if (!feature.name || feature.name.trim().length === 0) {
      errors.push(`Feature ${index + 1}: Name is required`)
    }
    if (!feature.description || feature.description.trim().length === 0) {
      errors.push(`Feature ${index + 1}: Description is required`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

export function generateARISpec(data: FormData): ARISpec {
  return {
    name: data.name,
    id: data.id,
    version: data.version,
    category: data.category,
    icon: data.icon,
    description: data.description,
    systemPrompt: data.systemPrompt,
    features: data.features,
    metadata: {
      createdAt: new Date().toISOString(),
      author: 'Internal Tool'
    }
  }
}

export function validateJSON(jsonString: string): { valid: boolean; error?: string; data?: ARISpec } {
  try {
    const parsed = JSON.parse(jsonString)
    
    // Basic validation
    if (!parsed.name || !parsed.id || !parsed.systemPrompt) {
      return {
        valid: false,
        error: 'Missing required fields: name, id, or systemPrompt'
      }
    }
    
    return {
      valid: true,
      data: parsed
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON'
    }
  }
}
