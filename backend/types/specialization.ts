/**
 * Spezialisierungs-Typen für A.R.I.
 * Spezialisierungen erweitern den AI-Kontext für spezifische Branchen
 */

/**
 * Signierte Spezialisierungs-Datei (von vertrauenswürdigem Marketplace)
 */
export interface SignedSpecialization {
  version: string; // Format-Version (z.B. "1.0")
  data: SpecializationData; // Die eigentlichen Daten
  signature: string; // Base64-kodierte Signatur
  issuer: string; // Marketplace domain (e.g., "marketplace.example.com")
  timestamp: number; // Unix timestamp
  orderId?: string; // WooCommerce Order ID (optional)
}

/**
 * Spezialisierungs-Daten
 */
export interface SpecializationData {
  id: string; // Eindeutige ID (z.B. "reisebuero")
  name: string; // Anzeigename
  description: string; // Kurzbeschreibung
  category: string; // Kategorie (z.B. "E-Commerce", "B2B", "Services")
  icon: string; // Emoji-Icon
  version: string; // Version der Spezialisierung

  // AI-Kontext
  systemPrompt: string; // Haupt-System-Prompt für diese Spezialisierung
  contextInstructions: string[]; // Zusätzliche Kontext-Anweisungen
  examplePrompts?: string[]; // Beispiel-Prompts für User

  // Metadata
  features: string[]; // Feature-Liste
  targetAudience?: string; // Zielgruppe
  keywords?: string[]; // Keywords für Suche
}

/**
 * Gespeicherte Spezialisierung (lokal verschlüsselt)
 */
export interface StoredSpecialization {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  version: string;
  features: string[];
  installedAt: number; // Timestamp der Installation
  filePath: string; // Pfad zur verschlüsselten Datei
  isActive: boolean; // Ist diese Spezialisierung aktiv?
}

/**
 * Spezialisierungs-Kontext für AI-Calls & Persistence
 * Extended mit zusätzlichen Metadaten für Speicherung
 */
export interface SpecializationContext {
  id: string;
  name: string;
  systemPrompt: string;
  contextInstructions: string[];
  description?: string; // Optional für Speicherung
  category?: string; // Optional für Speicherung
  version?: string; // Optional für Speicherung
  features?: string[]; // Optional für Speicherung
  author?: string; // Optional für Speicherung
  createdAt?: number; // Optional für Speicherung
  updatedAt?: number; // Optional für Speicherung
}
