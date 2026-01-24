import React from 'react'
import { Smile } from 'lucide-react'
import { FormData } from '../types/spec.types'

const CATEGORIES = ['Productivity', 'Communication', 'Analysis', 'Development', 'Creative', 'Other']
const EMOJI_OPTIONS = ['🤖', '💻', '📊', '🚀', '✨', '🎨', '📝', '🔍', '⚡', '🌟']

interface BasicInfoStepProps {
  data: FormData
  onChange: (field: keyof FormData, value: string) => void
}

export function BasicInfoStep({ data, onChange }: BasicInfoStepProps) {
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)

  const handleIdGeneration = () => {
    const slug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

    onChange('id', slug)
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Specialization Name *
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="e.g., WooCommerce Product Manager"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Max 100 characters</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ID (kebab-case) *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={data.id}
            onChange={(e) => onChange('id', e.target.value)}
            placeholder="e.g., woocommerce-product-manager"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleIdGeneration}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Generate
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Lowercase, numbers, and hyphens only</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Version *
          </label>
          <input
            type="text"
            value={data.version}
            onChange={(e) => onChange('version', e.target.value)}
            placeholder="1.0.0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Semver format</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={data.category}
            onChange={(e) => onChange('category', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select category...</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Icon Emoji *
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Smile size={18} />
            {data.icon || '🤖'}
          </button>
          <input
            type="text"
            value={data.icon}
            onChange={(e) => onChange('icon', e.target.value)}
            placeholder="Paste emoji or use picker"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {showEmojiPicker && (
          <div className="grid grid-cols-5 gap-2 mt-3 p-3 bg-gray-50 rounded-lg">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onChange('icon', emoji)
                  setShowEmojiPicker(false)
                }}
                className="text-2xl hover:bg-gray-200 p-2 rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Brief description of what this specialization does..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>
    </div>
  )
}
