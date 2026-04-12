import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/db/client';
import { libraryItems, itemLabels, translationCache } from '@/db/schema';

export function useLibraryItems() {
  return useLiveQuery(
    db.select().from(libraryItems).orderBy(desc(libraryItems.createdAt))
  );
}

export function useLibraryItem(id: number) {
  return useLiveQuery(
    db.select().from(libraryItems).where(eq(libraryItems.id, id)).limit(1)
  );
}

export function useItemLabels(itemId: number) {
  return useLiveQuery(
    db.select().from(itemLabels).where(eq(itemLabels.itemId, itemId))
  );
}

export async function saveLibraryItem(
  imagePath: string,
  labels: Array<{ label: string; confidence: number }>
): Promise<number> {
  const [item] = await db.insert(libraryItems).values({
    imagePath,
  }).returning({ id: libraryItems.id });

  if (labels.length > 0) {
    await db.insert(itemLabels).values(
      labels.map((l) => ({
        itemId: item.id,
        englishLabel: l.label,
        confidence: l.confidence,
      }))
    );
  }

  return item.id;
}

export async function deleteLibraryItem(id: number): Promise<void> {
  await db.delete(libraryItems).where(eq(libraryItems.id, id));
}

export async function toggleFavorite(id: number, currentValue: boolean): Promise<void> {
  await db.update(libraryItems)
    .set({ isFavorite: !currentValue })
    .where(eq(libraryItems.id, id));
}

export async function getItemTranslations(englishLabel: string) {
  return db.select()
    .from(translationCache)
    .where(eq(translationCache.englishLabel, englishLabel.toLowerCase()));
}
