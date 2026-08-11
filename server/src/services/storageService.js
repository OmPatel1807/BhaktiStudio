import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class StorageService {
  /**
   * Save uploaded photo data URL or buffer and return accessible URL
   * @param {string} base64OrBuffer 
   * @param {string} fileName 
   * @returns {string} Relative photo URL
   */
  static savePhoto(base64OrBuffer, fileName) {
    const timestamp = Date.now();
    const safeName = `${timestamp}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(UPLOAD_DIR, safeName);

    if (typeof base64OrBuffer === 'string' && base64OrBuffer.startsWith('data:image')) {
      const base64Data = base64OrBuffer.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    } else if (Buffer.isBuffer(base64OrBuffer)) {
      fs.writeFileSync(filePath, base64OrBuffer);
    } else {
      // Fallback placeholder image URL if mock upload
      return `https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600`;
    }

    return `/uploads/${safeName}`;
  }
}
