import { toPng } from 'jdenticon';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

export function generateAvatar(name: string): string | null {
  try {
    if (!name || typeof name !== 'string') {
      throw new Error('Invalid name provided for jdenticon generation.');
    }

    const username = name.toLowerCase().replace(/\s+/g, '');
    const png = toPng(username, 100);
    const dirPath = path.resolve('public', 'avatars');
    const filePath = path.join(dirPath, `${username}.png`);

    // Ensure the directory exists
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }

    writeFileSync(filePath, png);
    return `${username}.png`;
  } catch (err) {
    console.error('Error generating jdenticon:', err);
    return null;
  }
}
