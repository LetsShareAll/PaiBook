CREATE TABLE `entity` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`kind` text NOT NULL,
	`name_zh` text NOT NULL,
	`name_en` text,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `entity_game_kind_idx` ON `entity` (`game_id`,`kind`);--> statement-breakpoint
CREATE TABLE `game` (
	`id` text PRIMARY KEY NOT NULL,
	`title_zh` text NOT NULL,
	`title_en` text NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guide` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`version_id` text,
	`published_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`version_id`) REFERENCES `version`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guide_game_slug_idx` ON `guide` (`game_id`,`slug`);--> statement-breakpoint
CREATE INDEX `guide_game_status_idx` ON `guide` (`game_id`,`status`);--> statement-breakpoint
CREATE TABLE `guide_entity` (
	`guide_id` text NOT NULL,
	`entity_id` text NOT NULL,
	PRIMARY KEY(`guide_id`, `entity_id`),
	FOREIGN KEY (`guide_id`) REFERENCES `guide`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entity_id`) REFERENCES `entity`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `link` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`title` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`url` text NOT NULL,
	`source_name` text,
	`author` text,
	`version_id` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`version_id`) REFERENCES `version`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `link_game_idx` ON `link` (`game_id`);--> statement-breakpoint
CREATE TABLE `link_entity` (
	`link_id` text NOT NULL,
	`entity_id` text NOT NULL,
	PRIMARY KEY(`link_id`, `entity_id`),
	FOREIGN KEY (`link_id`) REFERENCES `link`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entity_id`) REFERENCES `entity`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `version` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`label` text NOT NULL,
	`released_on` text,
	`sort_key` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `version_game_label_idx` ON `version` (`game_id`,`label`);