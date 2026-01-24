import { ARISpec } from '../types/spec.types'

export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadARISpec(spec: ARISpec): void {
  const jsonString = JSON.stringify(spec, null, 2)
  const filename = `${spec.id}.ari-spec.json`
  downloadFile(jsonString, filename)
}

export function exportAsJSON(spec: ARISpec): string {
  return JSON.stringify(spec, null, 2)
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false)
}
