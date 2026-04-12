CREATE TABLE `item_labels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`english_label` text NOT NULL,
	`confidence` real NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `library_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `library_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`image_path` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`is_favorite` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `translation_cache` (
	`english_label` text NOT NULL,
	`target_language` text NOT NULL,
	`translated_word` text NOT NULL,
	`phonetic` text,
	PRIMARY KEY(`english_label`, `target_language`)
);
