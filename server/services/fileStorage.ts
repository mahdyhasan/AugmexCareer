import fs from 'fs';
import path from 'path';

export class FileStorageService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.ensureDirectoryExists(this.uploadsDir);
    this.ensureDirectoryExists(path.join(this.uploadsDir, 'resumes'));
  }

  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  public saveFile(buffer: Buffer, originalName: string, subDir: string = ''): string {
    const fileName = `${Date.now()}-${originalName}`;
    const fullPath = subDir ? path.join(this.uploadsDir, subDir) : this.uploadsDir;
    
    this.ensureDirectoryExists(fullPath);
    
    const filePath = path.join(fullPath, fileName);
    fs.writeFileSync(filePath, buffer);
    
    return subDir ? `/uploads/${subDir}/${fileName}` : `/uploads/${fileName}`;
  }

  public deleteFile(relativePath: string): boolean {
    try {
      const fullPath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  public fileExists(relativePath: string): boolean {
    const fullPath = path.join(process.cwd(), relativePath);
    return fs.existsSync(fullPath);
  }

  public readFile(relativePath: string): Buffer {
    const fullPath = path.join(process.cwd(), relativePath);
    return fs.readFileSync(fullPath);
  }
}

export const fileStorage = new FileStorageService();