import * as FileSystem from 'expo-file-system';

const PHOTO_DIR = FileSystem.documentDirectory + 'photos/';

async function ensurePhotoDir() {
  const info = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
}

export async function savePhoto(tempPath: string): Promise<string> {
  await ensurePhotoDir();
  const filename = `photo_${Date.now()}.jpg`;
  const destPath = PHOTO_DIR + filename;
  await FileSystem.copyAsync({ from: tempPath, to: destPath });
  return destPath;
}

export async function deletePhoto(path: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    await FileSystem.deleteAsync(path);
  }
}
