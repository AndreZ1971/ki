// backend/services/social/AssetStorageService.ts
import { logger } from '../../logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface AssetUploadResult {
  assetId: string;
  publicUrl: string;
  type: 'image' | 'audio' | 'video';
  mimeType: string;
  size: number;
  filename: string;
}

export interface AssetValidation {
  isValid: boolean;
  error?: string;
}

export class AssetStorageService {
  private readonly STORAGE_DIR = path.resolve(__dirname, '../../../data/social-assets');
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
  
  private readonly ALLOWED_MIME_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'],
    video: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo']
  };

  constructor() {
    this.ensureStorageDir();
  }

  private async ensureStorageDir(): Promise<void> {
    try {
      await fs.mkdir(this.STORAGE_DIR, { recursive: true });
      logger.info({ storageDir: this.STORAGE_DIR }, 'Asset storage directory ensured');
    } catch (error) {
      logger.error({ error, storageDir: this.STORAGE_DIR }, 'Failed to create storage directory');
      throw new Error('Storage initialization failed');
    }
  }

  private getAssetType(mimeType: string): 'image' | 'audio' | 'video' | null {
    for (const [type, mimes] of Object.entries(this.ALLOWED_MIME_TYPES)) {
      if (mimes.includes(mimeType)) {
        return type as 'image' | 'audio' | 'video';
      }
    }
    return null;
  }

  private getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'audio/mpeg': '.mp3',
      'audio/mp3': '.mp3',
      'audio/wav': '.wav',
      'audio/ogg': '.ogg',
      'video/mp4': '.mp4',
      'video/mpeg': '.mpeg',
      'video/quicktime': '.mov',
      'video/x-msvideo': '.avi'
    };
    return extensions[mimeType] || '';
  }

  validateAsset(mimeType: string, size: number): AssetValidation {
    // Check MIME type
    const assetType = this.getAssetType(mimeType);
    if (!assetType) {
      return {
        isValid: false,
        error: `Ungültiger MIME-Type: ${mimeType}. Erlaubt sind: ${Object.values(this.ALLOWED_MIME_TYPES).flat().join(', ')}`
      };
    }

    // Check file size
    if (size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `Datei zu groß (${Math.round(size / 1024 / 1024)}MB). Maximum: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    return { isValid: true };
  }

  async uploadAsset(
    fileBuffer: Buffer,
    mimeType: string,
    _originalFilename?: string
  ): Promise<AssetUploadResult> {
    // Validate
    const validation = this.validateAsset(mimeType, fileBuffer.length);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const assetType = this.getAssetType(mimeType)!;
    const assetId = randomUUID();
    const extension = this.getFileExtension(mimeType);
    const filename = `${assetId}${extension}`;
    const filePath = path.join(this.STORAGE_DIR, filename);

    // Save file to disk
    try {
      await fs.writeFile(filePath, fileBuffer);
      logger.info({ assetId, filename, size: fileBuffer.length, type: assetType }, 'Asset uploaded successfully');
    } catch (error) {
      logger.error({ error, assetId, filename }, 'Failed to save asset');
      throw new Error('Asset upload failed');
    }

    // Generate public URL (served via static route)
    const publicUrl = `/social/assets/${filename}`;

    return {
      assetId,
      publicUrl,
      type: assetType,
      mimeType,
      size: fileBuffer.length,
      filename
    };
  }

  async getAssetPath(assetId: string): Promise<string | null> {
    try {
      const files = await fs.readdir(this.STORAGE_DIR);
      const assetFile = files.find(f => f.startsWith(assetId));
      if (!assetFile) {
        return null;
      }
      return path.join(this.STORAGE_DIR, assetFile);
    } catch (error) {
      logger.error({ error, assetId }, 'Failed to find asset');
      return null;
    }
  }

  async deleteAsset(assetId: string): Promise<boolean> {
    try {
      const assetPath = await this.getAssetPath(assetId);
      if (!assetPath) {
        return false;
      }
      await fs.unlink(assetPath);
      logger.info({ assetId }, 'Asset deleted successfully');
      return true;
    } catch (error) {
      logger.error({ error, assetId }, 'Failed to delete asset');
      return false;
    }
  }

  getStorageDir(): string {
    return this.STORAGE_DIR;
  }
}
