import React from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'

export interface StepNavigationProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
  onNext: () => void
  onBack: () => void
  canProceed: boolean
}

export function StepNavigation({
  currentStep,
  totalSteps,
  stepLabels,
  onNext,
  onBack,
  canProceed
}: StepNavigationProps) {
  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {totalSteps}
          </h2>
          <span className="text-xs text-gray-500">{stepLabels[currentStep]}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between">
        {stepLabels.map((label, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                index < currentStep
                  ? 'bg-green-500 text-white'
                  : index === currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
              }`}
            >
              {index < currentStep ? '✓' : index + 1}
            </div>
            <span className="text-xs text-gray-600 mt-1 text-center max-w-16">{label}</span>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={18} />
          Back
        </button>

        <button
          onClick={onNext}
          disabled={!canProceed || currentStep === totalSteps - 1}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
