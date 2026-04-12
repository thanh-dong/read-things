import { Paths, Directory, File } from 'expo-file-system';

const PHOTO_DIR = new Directory(Paths.document, 'photos');

function ensurePhotoDir() {
  if (!PHOTO_DIR.exists) {
    PHOTO_DIR.create({ intermediates: true });
  }
}

export async function savePhoto(tempPath: string): Promise<string> {
  ensurePhotoDir();
  const filename = `photo_${Date.now()}.jpg`;
  const destFile = new File(PHOTO_DIR, filename);
  const sourceFile = new File(tempPath);
  sourceFile.copy(destFile);
  return destFile.uri;
}

export function deletePhoto(path: string): void {
  const file = new File(path);
  if (file.exists) {
    file.delete();
  }
}
