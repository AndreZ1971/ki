import React from 'react'
import { Download, Copy, Check, Upload } from 'lucide-react'
import { FormData, ARISpec } from '../types/spec.types'
import { generateARISpec, validateJSON } from '../utils/validation'
import { downloadARISpec, copyToClipboard } from '../utils/download'

interface PreviewStepProps {
  data: FormData
  onImport: (data: FormData) => void
}

export function PreviewStep({ data, onImport }: PreviewStepProps) {
  const [copied, setCopied] = React.useState(false)
  const [showFormatted, setShowFormatted] = React.useState(true)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const spec: ARISpec = generateARISpec(data)
  const jsonString = JSON.stringify(spec, null, 2)

  const handleCopy = async () => {
    const success = await copyToClipboard(jsonString)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    downloadARISpec(spec)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const validation = validateJSON(content)

      if (validation.valid && validation.data) {
        const importedData: FormData = {
          name: validation.data.name,
          id: validation.data.id,
          version: validation.data.version,
          category: validation.data.category,
          icon: validation.data.icon,
          description: validation.data.description,
          systemPrompt: validation.data.systemPrompt,
          features: validation.data.features
        }
        onImport(importedData)
      } else {
        alert(`Import failed: ${validation.error}`)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setShowFormatted(true)}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            showFormatted
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Formatted JSON
        </button>
        <button
          onClick={() => setShowFormatted(false)}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            !showFormatted
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Minified
        </button>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 overflow-hidden">
        <pre className="text-green-400 text-xs font-mono overflow-x-auto max-h-96">
          {showFormatted ? jsonString : JSON.stringify(spec)}
        </pre>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {copied ? (
            <>
              <Check size={18} />
              Copied to Clipboard!
            </>
          ) : (
            <>
              <Copy size={18} />
              Copy to Clipboard
            </>
          )}
        </button>

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download size={18} />
          Download .ari-spec
        </button>
      </div>

      <div className="border-t pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Import Existing Spec</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={handleImportClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition-colors font-medium text-sm"
        >
          <Upload size={18} />
          Import .ari-spec File
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Import an existing .ari-spec.json file to edit it in this tool
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900 mb-2">📋 Summary</p>
        <div className="text-xs text-blue-800 space-y-1">
          <p>
            <span className="font-semibold">Name:</span> {spec.name}
          </p>
          <p>
            <span className="font-semibold">ID:</span> {spec.id}
          </p>
          <p>
            <span className="font-semibold">Version:</span> {spec.version}
          </p>
          <p>
            <span className="font-semibold">Features:</span> {spec.features.length}
          </p>
          <p>
            <span className="font-semibold">Created:</span>{' '}
            {new Date(spec.metadata?.createdAt || '').toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
