import React, { useState } from 'react'
import { Zap } from 'lucide-react'
import { StepNavigation } from './components/StepNavigation'
import { BasicInfoStep } from './components/BasicInfoStep'
import { SystemPromptStep } from './components/SystemPromptStep'
import { FeaturesStep } from './components/FeaturesStep'
import { PreviewStep } from './components/PreviewStep'
import { validateSpec } from './utils/validation'
import { FormData, Feature } from './types/spec.types'

const STEP_LABELS = ['Basic Info', 'System Prompt', 'Features', 'Preview']

const initialFormData: FormData = {
  name: '',
  id: '',
  version: '1.0.0',
  category: '',
  icon: '🤖',
  description: '',
  systemPrompt: '',
  features: []
}

export default function App() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<string[]>([])

  const handleFieldChange = (field: keyof FormData, value: string | Feature[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
    setErrors([])
  }

  const validateCurrentStep = (): boolean => {
    const stepValidations = {
      0: () => {
        // Basic info validation
        const nameEmpty = !formData.name.trim()
        const idEmpty = !formData.id.trim()
        const idInvalid = formData.id && !/^[a-z0-9-]+$/.test(formData.id)
        const versionEmpty = !formData.version.trim()
        const categoryEmpty = !formData.category.trim()

        const stepErrors = []
        if (nameEmpty) stepErrors.push('Name is required')
        if (idEmpty) stepErrors.push('ID is required')
        if (idInvalid) stepErrors.push('ID must contain only lowercase letters, numbers, and hyphens')
        if (versionEmpty) stepErrors.push('Version is required')
        if (categoryEmpty) stepErrors.push('Category is required')

        setErrors(stepErrors)
        return stepErrors.length === 0
      },
      1: () => {
        const promptEmpty = !formData.systemPrompt.trim()
        const stepErrors = []
        if (promptEmpty) stepErrors.push('System prompt is required')
        setErrors(stepErrors)
        return stepErrors.length === 0
      },
      2: () => {
        if (formData.features.length === 0) {
          setErrors(['At least one feature is required'])
          return false
        }

        const stepErrors: string[] = []
        formData.features.forEach((feature, index) => {
          if (!feature.name.trim()) {
            stepErrors.push(`Feature ${index + 1}: Name is required`)
          }
          if (!feature.description.trim()) {
            stepErrors.push(`Feature ${index + 1}: Description is required`)
          }
        })

        setErrors(stepErrors)
        return stepErrors.length === 0
      },
      3: () => {
        const validation = validateSpec(formData)
        setErrors(validation.errors)
        return validation.valid
      }
    }

    const validator = stepValidations[currentStep as keyof typeof stepValidations]
    return validator ? validator() : true
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < STEP_LABELS.length - 1) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setErrors([])
    }
  }

  const handleImport = (importedData: FormData) => {
    setFormData(importedData)
    setCurrentStep(0)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep data={formData} onChange={handleFieldChange} />
      case 1:
        return <SystemPromptStep data={formData} onChange={handleFieldChange} />
      case 2:
        return <FeaturesStep data={formData} onChange={handleFieldChange} />
      case 3:
        return <PreviewStep data={formData} onImport={handleImport} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Zap className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">A.R.I. Specialization Creator</h1>
              <p className="text-sm text-gray-600 mt-1">Internal Tool • Create .ari-spec files visually</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 sticky top-24">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-4">
                Steps
              </p>
              <div className="space-y-2">
                {STEP_LABELS.map((label, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (index <= currentStep) {
                        setCurrentStep(index)
                        setErrors([])
                      }
                    }}
                    disabled={index > currentStep}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      index === currentStep
                        ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
                        : index < currentStep
                          ? 'text-gray-700 hover:bg-gray-100'
                          : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {index < currentStep ? '✓' : index + 1}. {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Form Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
              {/* Error Messages */}
              {errors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-800 mb-2">Please fix the following issues:</p>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    {errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step Content */}
              <div className="mb-8">{renderStep()}</div>

              {/* Step Navigation */}
              <StepNavigation
                currentStep={currentStep}
                totalSteps={STEP_LABELS.length}
                stepLabels={STEP_LABELS}
                onNext={handleNext}
                onBack={handleBack}
                canProceed={errors.length === 0}
              />
            </div>

            {/* Footer Note */}
            <div className="mt-6 text-center text-xs text-gray-600">
              <p>🔒 For internal use only • Not part of A.R.I. production</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
