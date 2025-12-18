import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  SignedSpecialization,
  SpecializationData,
  StoredSpecialization,
  SpecializationContext,
} from '../types/specialization';
import { logger } from '../logger';

/**
 * Public Key von kaufe-es.eu für Signatur-Validierung
 * TODO: In Produktion aus Environment-Variable laden
 */
const KAUFE_ES_PUBLIC_KEY =
  process.env.SPEC_PUBLIC_KEY ||
  `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyVxQ9jK5pZ7N2rH8kE3v
9wQ4mF5gN7pL2sT6vU8xY9jR3kL7mN4pQ8sV6wX5yZ9jT7mL8pN9sR4vK7mT6pU9
-----END PUBLIC KEY-----`;

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = Buffer.from(
  process.env.SPEC_ENCRYPTION_KEY || 'default-32-byte-key-change-me!',
  'utf-8'
).subarray(0, 32);

const DATA_DIR = path.join(process.cwd(), 'data', 'specializations');

/**
 * Spezialisierungs-Service
 * Verwaltet Upload, Validierung, Speicherung und Aktivierung von Spezialisierungen
 */
export class SpecializationService {
  /**
   * Validiert die WooCommerce-Signatur einer Spezialisierungs-Datei
   */
  static validateSignature(signedSpec: SignedSpecialization): boolean {
    try {
      // Prüfe Format
      if (
        !signedSpec.version ||
        !signedSpec.data ||
        !signedSpec.signature ||
        !signedSpec.issuer
      ) {
        logger.warn('❌ Ungültiges Spezialisierungs-Format');
        return false;
      }

      // Prüfe Issuer
      if (signedSpec.issuer !== 'kaufe-es.eu') {
        logger.warn(`❌ Ungültiger Issuer: ${signedSpec.issuer}`);
        return false;
      }

      // Signatur verifizieren
      const payload = JSON.stringify(signedSpec.data);
      const signature = Buffer.from(signedSpec.signature, 'base64');

      const isValid = crypto.verify(
        'sha256',
        Buffer.from(payload),
        {
          key: KAUFE_ES_PUBLIC_KEY,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        },
        signature
      );

      if (!isValid) {
        logger.warn('❌ Signatur-Validierung fehlgeschlagen');
        return false;
      }

      logger.info(
        `✅ Signatur gültig für Spezialisierung: ${signedSpec.data.name}`
      );
      return true;
    } catch (error) {
      logger.error({ err: error }, '❌ Fehler bei Signatur-Validierung');
      return false;
    }
  }

  /**
   * Verschlüsselt und speichert eine Spezialisierung
   */
  static async encryptAndStore(
    specData: SpecializationData,
    userId: string = 'default'
  ): Promise<StoredSpecialization> {
    try {
      // User-Verzeichnis erstellen
      const userDir = path.join(DATA_DIR, userId);
      await fs.promises.mkdir(userDir, { recursive: true });

      // Verschlüsseln
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        ENCRYPTION_ALGORITHM,
        ENCRYPTION_KEY,
        iv
      );

      const plaintext = JSON.stringify(specData);
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // Speichern
      const fileName = `${specData.id}.enc`;
      const filePath = path.join(userDir, fileName);

      const encryptedData = {
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        data: encrypted,
      };

      await fs.promises.writeFile(
        filePath,
        JSON.stringify(encryptedData),
        'utf-8'
      );

      logger.info(`✅ Spezialisierung gespeichert: ${filePath}`);

      // Metadata speichern
      const stored: StoredSpecialization = {
        id: specData.id,
        name: specData.name,
        description: specData.description,
        category: specData.category,
        icon: specData.icon,
        version: specData.version,
        features: specData.features,
        installedAt: Date.now(),
        filePath,
        isActive: false,
      };

      await this.saveMetadata(userId, stored);
      return stored;
    } catch (error) {
      logger.error({ err: error }, '❌ Fehler beim Verschlüsseln/Speichern');
      throw error;
    }
  }

  /**
   * Entschlüsselt eine gespeicherte Spezialisierung
   */
  static async decryptSpecialization(
    filePath: string
  ): Promise<SpecializationData> {
    try {
      const fileContent = await fs.promises.readFile(filePath, 'utf-8');
      const { iv, authTag, data } = JSON.parse(fileContent);

      const decipher = crypto.createDecipheriv(
        ENCRYPTION_ALGORITHM,
        ENCRYPTION_KEY,
        Buffer.from(iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      logger.error({ err: error }, '❌ Fehler beim Entschlüsseln');
      throw error;
    }
  }

  /**
   * Speichert Metadata für installierte Spezialisierungen
   */
  static async saveMetadata(
    userId: string,
    spec: StoredSpecialization
  ): Promise<void> {
    const metadataPath = path.join(DATA_DIR, userId, 'metadata.json');

    let metadata: StoredSpecialization[] = [];
    try {
      const existing = await fs.promises.readFile(metadataPath, 'utf-8');
      metadata = JSON.parse(existing);
    } catch {
      // Datei existiert noch nicht
    }

    // Entferne alte Version falls vorhanden
    metadata = metadata.filter((s) => s.id !== spec.id);
    metadata.push(spec);

    await fs.promises.writeFile(
      metadataPath,
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );
  }

  /**
   * Lädt Metadata für alle installierten Spezialisierungen
   */
  static async getInstalledSpecializations(
    userId: string = 'default'
  ): Promise<StoredSpecialization[]> {
    const metadataPath = path.join(DATA_DIR, userId, 'metadata.json');

    try {
      const content = await fs.promises.readFile(metadataPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  /**
   * Aktiviert eine Spezialisierung
   */
  static async activateSpecialization(
    userId: string,
    specId: string
  ): Promise<void> {
    const specs = await this.getInstalledSpecializations(userId);

    // Deaktiviere alle anderen
    specs.forEach((s) => (s.isActive = false));

    // Aktiviere die gewählte
    const target = specs.find((s) => s.id === specId);
    if (!target) {
      throw new Error(`Spezialisierung ${specId} nicht gefunden`);
    }
    target.isActive = true;

    // Speichere
    const metadataPath = path.join(DATA_DIR, userId, 'metadata.json');
    await fs.promises.writeFile(
      metadataPath,
      JSON.stringify(specs, null, 2),
      'utf-8'
    );

    logger.info(`✅ Spezialisierung aktiviert: ${specId}`);
  }

  /**
   * Lädt die aktive Spezialisierung für AI-Kontext
   */
  static async getActiveSpecialization(
    userId: string = 'default'
  ): Promise<SpecializationContext | null> {
    try {
      const specs = await this.getInstalledSpecializations(userId);
      const active = specs.find((s) => s.isActive);

      if (!active) return null;

      // Entschlüssele die Daten
      const data = await this.decryptSpecialization(active.filePath);

      return {
        id: data.id,
        name: data.name,
        systemPrompt: data.systemPrompt,
        contextInstructions: data.contextInstructions,
      };
    } catch (error) {
      logger.error(
        { err: error },
        '❌ Fehler beim Laden der aktiven Spezialisierung'
      );
      return null;
    }
  }

  /**
   * Löscht eine Spezialisierung
   */
  static async deleteSpecialization(
    userId: string,
    specId: string
  ): Promise<void> {
    const specs = await this.getInstalledSpecializations(userId);
    const target = specs.find((s) => s.id === specId);

    if (!target) {
      throw new Error(`Spezialisierung ${specId} nicht gefunden`);
    }

    // Lösche verschlüsselte Datei
    await fs.promises.unlink(target.filePath);

    // Update Metadata
    const remaining = specs.filter((s) => s.id !== specId);
    const metadataPath = path.join(DATA_DIR, userId, 'metadata.json');
    await fs.promises.writeFile(
      metadataPath,
      JSON.stringify(remaining, null, 2),
      'utf-8'
    );

    logger.info(`✅ Spezialisierung gelöscht: ${specId}`);
  }
}
