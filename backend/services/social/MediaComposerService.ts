// backend/services/social/MediaComposerService.ts
import { logger } from '../../logger';
import { AssetStorageService } from './AssetStorageService';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

export interface ComposeVideoRequest {
  imageUrls: string[];
  audioUrl: string;
  duration?: number; // Duration per image in seconds, default: auto-calculated from audio
}

export interface ComposeVideoResult {
  assetId: string;
  publicUrl: string;
  videoPath: string;
  duration: number;
}

export class MediaComposerService {
  private readonly TEMP_DIR = path.resolve(__dirname, '../../../data/temp-compose');
  private assetStorage: AssetStorageService;

  constructor() {
    this.assetStorage = new AssetStorageService();
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.TEMP_DIR, { recursive: true });
      logger.info({ tempDir: this.TEMP_DIR }, 'Temp compose directory ensured');
    } catch (error) {
      logger.error({ error, tempDir: this.TEMP_DIR }, 'Failed to create temp directory');
    }
  }

  private async checkFfmpeg(): Promise<boolean> {
    try {
      await execAsync('ffmpeg -version');
      return true;
    } catch (_error) {
      logger.error('ffmpeg not found in PATH');
      return false;
    }
  }

  private async downloadFile(url: string, destPath: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download ${url}: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    await fs.writeFile(destPath, Buffer.from(buffer));
  }

  async composeVideo(request: ComposeVideoRequest): Promise<ComposeVideoResult> {
    const { imageUrls, audioUrl, duration } = request;

    // Validate ffmpeg availability
    const hasFfmpeg = await this.checkFfmpeg();
    if (!hasFfmpeg) {
      throw new Error('ffmpeg ist nicht installiert. Bitte installieren Sie ffmpeg um Videos zu erstellen.');
    }

    if (!imageUrls || imageUrls.length === 0) {
      throw new Error('Mindestens ein Bild ist erforderlich');
    }

    if (!audioUrl) {
      throw new Error('Audio ist erforderlich');
    }

    const sessionId = randomUUID();
    const sessionDir = path.join(this.TEMP_DIR, sessionId);
    await fs.mkdir(sessionDir, { recursive: true });

    try {
      // Download audio
      const audioPath = path.join(sessionDir, 'audio.mp3');
      logger.info({ audioUrl }, 'Downloading audio');
      await this.downloadFile(audioUrl, audioPath);

      // Get audio duration
      const { stdout: probeOutput } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
      );
      const audioDuration = parseFloat(probeOutput.trim());
      logger.info({ audioDuration }, 'Audio duration detected');

      // Calculate duration per image
      const durationPerImage = duration || (audioDuration / imageUrls.length);

      // Download images
      const imagePaths: string[] = [];
      for (let i = 0; i < imageUrls.length; i++) {
        const imagePath = path.join(sessionDir, `image${i}.jpg`);
        logger.info({ imageUrl: imageUrls[i], index: i }, 'Downloading image');
        await this.downloadFile(imageUrls[i], imagePath);
        imagePaths.push(imagePath);
      }

      // Create concat file for ffmpeg
      const concatFilePath = path.join(sessionDir, 'concat.txt');
      const concatContent = imagePaths
        .map(p => `file '${path.basename(p)}'\nduration ${durationPerImage}`)
        .join('\n') + `\nfile '${path.basename(imagePaths[imagePaths.length - 1])}'`; // Last frame
      await fs.writeFile(concatFilePath, concatContent);

      // Output video path
      const outputVideoPath = path.join(sessionDir, 'output.mp4');

      // ffmpeg command to create video from images + audio
      // -f concat: use concat demuxer for images
      // -i concat.txt: input file list
      // -i audio.mp3: audio input
      // -c:v libx264: H.264 video codec
      // -c:a aac: AAC audio codec
      // -pix_fmt yuv420p: pixel format for compatibility
      // -shortest: end video when shortest input ends
      const ffmpegCmd = [
        'ffmpeg',
        '-y', // overwrite output
        '-f concat',
        '-safe 0',
        `-i "${concatFilePath}"`,
        `-i "${audioPath}"`,
        '-c:v libx264',
        '-c:a aac',
        '-pix_fmt yuv420p',
        '-vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2"', // 720p with padding
        '-shortest',
        `"${outputVideoPath}"`
      ].join(' ');

      logger.info({ ffmpegCmd }, 'Executing ffmpeg command');
      await execAsync(ffmpegCmd);

      // Read composed video
      const videoBuffer = await fs.readFile(outputVideoPath);

      // Upload to asset storage
      const uploadResult = await this.assetStorage.uploadAsset(
        videoBuffer,
        'video/mp4',
        `composed-${sessionId}.mp4`
      );

      logger.info({ assetId: uploadResult.assetId, size: videoBuffer.length }, 'Video composed and uploaded successfully');

      // Cleanup temp files
      await this.cleanupSession(sessionDir);

      return {
        assetId: uploadResult.assetId,
        publicUrl: uploadResult.publicUrl,
        videoPath: await this.assetStorage.getAssetPath(uploadResult.assetId) || '',
        duration: audioDuration
      };

    } catch (error) {
      logger.error({ error, sessionId }, 'Video composition failed');
      await this.cleanupSession(sessionDir);
      throw error;
    }
  }

  private async cleanupSession(sessionDir: string): Promise<void> {
    try {
      await fs.rm(sessionDir, { recursive: true, force: true });
      logger.info({ sessionDir }, 'Cleaned up temp session directory');
    } catch (error) {
      logger.warn({ error, sessionDir }, 'Failed to cleanup temp directory');
    }
  }
}
