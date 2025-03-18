import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ErrorWithStatus, NotFoundError } from '@tools/errors';

const __dirname = dirname(fileURLToPath(import.meta.url));

class StorageService {
  private readonly BASE_STORAGE_PATH: string;
  private readonly MAX_FILE_SIZE: number;
  private readonly ALLOWED_MIME_TYPES: Set<string>;

  constructor() {
    this.BASE_STORAGE_PATH = join(__dirname, '..', 'storage');
    this.MAX_FILE_SIZE = 1024 * 1024 * 10; // 10MB
    this.ALLOWED_MIME_TYPES = new Set([
      'application/pdf',
      'image/jpeg',
      'image/png',
      'text/plain',
    ]);
  }

  async writeFile(filePath: string, data: Buffer | string): Promise<void> {
    const absolutePath = join(this.BASE_STORAGE_PATH, filePath);

    try {
      await fs.mkdir(dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, data, { flag: 'wx' });
    } catch (error: any) {
      if (error.code === 'EEXIST') {
        throw new ErrorWithStatus('File already exists', 409);
      }
      throw new ErrorWithStatus(`File write error: ${error.message}`, 500);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    const absolutePath = join(this.BASE_STORAGE_PATH, filePath);

    try {
      await fs.access(absolutePath);
      await fs.unlink(absolutePath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new NotFoundError('File not found');
      }
      throw new ErrorWithStatus(`File deletion error: ${error.message}`, 500);
    }
  }

  async readFile(filePath: string): Promise<Buffer> {
    const absolutePath = join(this.BASE_STORAGE_PATH, filePath);

    try {
      return await fs.readFile(absolutePath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new NotFoundError('File not found');
      }
      throw new ErrorWithStatus(`File read error: ${error.message}`, 500);
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(join(this.BASE_STORAGE_PATH, filePath));
      return true;
    } catch {
      return false;
    }
  }

  private validateFileType(mimeType: string): void {
    if (!this.ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new ErrorWithStatus('Unsupported file type', 400);
    }
  }

  private validateFileSize(size: number): void {
    if (size > this.MAX_FILE_SIZE) {
      throw new ErrorWithStatus('File size exceeds limit', 413);
    }
  }

  // Utilitaire pour les paths
  getStoragePath(...paths: string[]): string {
    return join(this.BASE_STORAGE_PATH, ...paths);
  }
}

export default StorageService;