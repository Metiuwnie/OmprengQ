CREATE TABLE `schools` (
	`id` varchar(36) NOT NULL,
	`sppg_id` varchar(36) NOT NULL,
	`name` varchar(200) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`levels` json NOT NULL,
	`timezone` varchar(50) NOT NULL DEFAULT 'Asia/Jakarta',
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `schools_id` PRIMARY KEY(`id`),
	CONSTRAINT `schools_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `sppg` (
	`id` varchar(36) NOT NULL,
	`name` varchar(200) NOT NULL,
	`region` varchar(200),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sppg_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`name` varchar(200) NOT NULL,
	`role` enum('super_admin','sppg_admin','school_admin') NOT NULL,
	`sppg_id` varchar(36),
	`school_id` varchar(36),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `foods` (
	`id` varchar(36) NOT NULL,
	`code` varchar(50),
	`name` varchar(200) NOT NULL,
	`category` varchar(50) NOT NULL,
	`energy_kcal` decimal(9,2) NOT NULL,
	`protein_g` decimal(9,2) NOT NULL,
	`fat_g` decimal(9,2) NOT NULL,
	`carb_g` decimal(9,2) NOT NULL,
	`fiber_g` decimal(9,2) NOT NULL,
	`iron_mg` decimal(9,2) NOT NULL,
	`edible_pct` decimal(9,2) NOT NULL DEFAULT 100,
	`allergens` json NOT NULL,
	`is_custom` boolean NOT NULL DEFAULT false,
	CONSTRAINT `foods_id` PRIMARY KEY(`id`),
	CONSTRAINT `foods_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` varchar(36) NOT NULL,
	`portion_id` varchar(36) NOT NULL,
	`food_id` varchar(36) NOT NULL,
	`grams` decimal(9,2) NOT NULL,
	`label` varchar(200),
	`visual_unit` varchar(100),
	`benefit` varchar(300),
	CONSTRAINT `menu_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_portions` (
	`id` varchar(36) NOT NULL,
	`menu_id` varchar(36) NOT NULL,
	`level` enum('sd_low','sd_high','smp','sma') NOT NULL,
	`totals` json NOT NULL,
	`allergens` json NOT NULL,
	CONSTRAINT `menu_portions_id` PRIMARY KEY(`id`),
	CONSTRAINT `portion_menu_level` UNIQUE(`menu_id`,`level`)
);
--> statement-breakpoint
CREATE TABLE `menus` (
	`id` varchar(36) NOT NULL,
	`sppg_id` varchar(36) NOT NULL,
	`date` date NOT NULL,
	`name` varchar(300) NOT NULL,
	`description` text,
	`photo_url` varchar(500),
	`fun_fact` text,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	CONSTRAINT `menus_id` PRIMARY KEY(`id`),
	CONSTRAINT `menu_sppg_date` UNIQUE(`sppg_id`,`date`)
);
--> statement-breakpoint
CREATE TABLE `akg_reference` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sex` enum('male','female') NOT NULL,
	`age_min` int NOT NULL,
	`age_max` int NOT NULL,
	`energy_kcal` int NOT NULL,
	`protein_g` int NOT NULL,
	`fat_g` int NOT NULL,
	`carb_g` int NOT NULL,
	`fiber_g` int NOT NULL,
	`iron_mg` int NOT NULL,
	CONSTRAINT `akg_reference_id` PRIMARY KEY(`id`),
	CONSTRAINT `akg_sex_age` UNIQUE(`sex`,`age_min`,`age_max`)
);
--> statement-breakpoint
CREATE TABLE `household_foods` (
	`id` varchar(36) NOT NULL,
	`name` varchar(200) NOT NULL,
	`category` varchar(50) NOT NULL,
	`urt_label` varchar(100) NOT NULL,
	`grams` decimal(9,2) NOT NULL,
	`energy_kcal` decimal(9,2) NOT NULL,
	`protein_g` decimal(9,2) NOT NULL,
	`fat_g` decimal(9,2) NOT NULL,
	`carb_g` decimal(9,2) NOT NULL,
	`fiber_g` decimal(9,2) NOT NULL,
	`iron_mg` decimal(9,2) NOT NULL,
	`allergens` json NOT NULL,
	`meal_slots` json NOT NULL,
	`price_tier` int NOT NULL DEFAULT 1,
	`emoji` varchar(16),
	CONSTRAINT `household_foods_id` PRIMARY KEY(`id`),
	CONSTRAINT `household_foods_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `schools` ADD CONSTRAINT `schools_sppg_id_sppg_id_fk` FOREIGN KEY (`sppg_id`) REFERENCES `sppg`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_sppg_id_sppg_id_fk` FOREIGN KEY (`sppg_id`) REFERENCES `sppg`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menu_items` ADD CONSTRAINT `menu_items_portion_id_menu_portions_id_fk` FOREIGN KEY (`portion_id`) REFERENCES `menu_portions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menu_items` ADD CONSTRAINT `menu_items_food_id_foods_id_fk` FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menu_portions` ADD CONSTRAINT `menu_portions_menu_id_menus_id_fk` FOREIGN KEY (`menu_id`) REFERENCES `menus`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menus` ADD CONSTRAINT `menus_sppg_id_sppg_id_fk` FOREIGN KEY (`sppg_id`) REFERENCES `sppg`(`id`) ON DELETE no action ON UPDATE no action;