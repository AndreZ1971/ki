import React from 'react'
import { Copy, Check } from 'lucide-react'
import { FormData } from '../types/spec.types'

interface SystemPromptStepProps {
  data: FormData
  onChange: (field: keyof FormData, value: string) => void
}

export function SystemPromptStep({ data, onChange }: SystemPromptStepProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.systemPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error('Failed to copy')
    }
  }

  const insertTemplate = (template: string) => {
    const current = data.systemPrompt
    onChange('systemPrompt', current ? `${current}\n\n${template}` : template)
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            System Prompt *
          </label>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
          >
            {copied ? (
              <>
                <Check size={14} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={14} />
                Copy
              </>
            )}
          </button>
        </div>
        <textarea
          value={data.systemPrompt}
          onChange={(e) => onChange('systemPrompt', e.target.value)}
          placeholder="Define the system prompt that will guide the AI agent behavior..."
          rows={12}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
        />
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{data.systemPrompt.length} / 5000 characters</span>
          {data.systemPrompt.length > 4500 && (
            <span className="text-orange-600">Approaching limit</span>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900 mb-3">Quick Templates</p>
        <div className="space-y-2">
          <button
            onClick={() =>
              insertTemplate(
                `You are a specialized AI assistant focused on [DOMAIN]. Your primary responsibilities are:
- Understand user requirements in [DOMAIN]
- Provide expert guidance based on best practices
- Offer clear, actionable solutions
- Maintain professional communication`
              )
            }
            className="block w-full text-left text-xs px-3 py-2 bg-white border border-blue-200 rounded hover:bg-blue-100 transition-colors"
          >
            + Basic Expert Template
          </button>
          <button
            onClick={() =>
              insertTemplate(
                `When responding:
1. Analyze the problem thoroughly
2. Consider multiple solutions
3. Provide pros and cons for each
4. Recommend the best approach
5. Explain your reasoning`
              )
            }
            className="block w-full text-left text-xs px-3 py-2 bg-white border border-blue-200 rounded hover:bg-blue-100 transition-colors"
          >
            + Problem-Solving Template
          </button>
          <button
            onClick={() =>
              insertTemplate(
                `You specialize in integration and automation. Your expertise includes:
- API design and implementation
- Workflow optimization
- Data transformation
- System integration best practices`
              )
            }
            className="block w-full text-left text-xs px-3 py-2 bg-white border border-blue-200 rounded hover:bg-blue-100 transition-colors"
          >
            + Integration Template
          </button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        <p className="font-medium mb-1">💡 Pro Tips</p>
        <ul className="text-xs space-y-1 list-disc list-inside">
          <li>Be specific about the AI agent's role and expertise</li>
          <li>Include constraints and guidelines for consistent behavior</li>
          <li>Mention output format preferences if relevant</li>
          <li>Consider tone and communication style</li>
        </ul>
      </div>
    </div>
  )
}
