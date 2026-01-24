import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { FormData, Feature } from '../types/spec.types'

interface FeaturesStepProps {
  data: FormData
  onChange: (field: keyof FormData, value: Feature[]) => void
}

export function FeaturesStep({ data, onChange }: FeaturesStepProps) {
  const addFeature = () => {
    const newFeature: Feature = {
      id: `feature-${Date.now()}`,
      name: '',
      description: ''
    }
    onChange('features', [...data.features, newFeature])
  }

  const removeFeature = (index: number) => {
    onChange(
      'features',
      data.features.filter((_, i) => i !== index)
    )
  }

  const updateFeature = (index: number, field: 'name' | 'description', value: string) => {
    const updated = [...data.features]
    updated[index] = { ...updated[index], [field]: value }
    onChange('features', updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Define the key features or capabilities of this specialization
        </p>
        <span className="text-xs text-gray-500">{data.features.length} features</span>
      </div>

      <div className="space-y-4">
        {data.features.map((feature, index) => (
          <div key={feature.id} className="p-4 border border-gray-200 rounded-lg bg-white">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold text-gray-600">Feature {index + 1}</span>
              <button
                onClick={() => removeFeature(index)}
                className="text-red-600 hover:text-red-700 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Feature Name *
                </label>
                <input
                  type="text"
                  value={feature.name}
                  onChange={(e) => updateFeature(index, 'name', e.target.value)}
                  placeholder="e.g., Automated Product Creation"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={feature.description}
                  onChange={(e) => updateFeature(index, 'description', e.target.value)}
                  placeholder="Describe what this feature does..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addFeature}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition-colors font-medium text-sm"
      >
        <Plus size={18} />
        Add Feature
      </button>

      {data.features.length === 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            ⚠️ At least one feature is required to proceed
          </p>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
        <p className="font-medium mb-1">✓ Feature Best Practices</p>
        <ul className="text-xs space-y-1 list-disc list-inside">
          <li>Keep feature names concise (2-5 words)</li>
          <li>Descriptions should explain the benefit, not just what it does</li>
          <li>Aim for 3-5 key features that define the specialization</li>
          <li>Focus on user-facing capabilities, not technical details</li>
        </ul>
      </div>
    </div>
  )
}
