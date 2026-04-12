import { sql } from 'drizzle-orm';
import { integer, text, real, sqliteTable, primaryKey } from 'drizzle-orm/sqlite-core';

export const libraryItems = sqliteTable('library_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  imagePath: text('image_path').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
});

export const itemLabels = sqliteTable('item_labels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  itemId: integer('item_id').notNull().references(() => libraryItems.id, { onDelete: 'cascade' }),
  englishLabel: text('english_label').notNull(),
  confidence: real('confidence').notNull(),
});

export const translationCache = sqliteTable('translation_cache', {
  englishLabel: text('english_label').notNull(),
  targetLanguage: text('target_language').notNull(),
  translatedWord: text('translated_word').notNull(),
  phonetic: text('phonetic'),
}, (table) => [
  primaryKey({ columns: [table.englishLabel, table.targetLanguage] }),
]);

export type InsertLibraryItem = typeof libraryItems.$inferInsert;
export type SelectLibraryItem = typeof libraryItems.$inferSelect;
export type InsertItemLabel = typeof itemLabels.$inferInsert;
export type SelectItemLabel = typeof itemLabels.$inferSelect;
export type InsertTranslation = typeof translationCache.$inferInsert;
export type SelectTranslation = typeof translationCache.$inferSelect;
