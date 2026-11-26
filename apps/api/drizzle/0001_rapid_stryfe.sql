CREATE TABLE `usage_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` varchar(36) NOT NULL,
	`date` varchar(10) NOT NULL,
	`event_type` enum('menu_view','share_wa','calculator_open','quiz_done') NOT NULL,
	`count` int NOT NULL DEFAULT 1,
	CONSTRAINT `usage_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `usage_events_school_date_type` UNIQUE(`school_id`,`date`,`event_type`)
);
--> statement-breakpoint
ALTER TABLE `usage_events` ADD CONSTRAINT `usage_events_school_id_schools_id_fk` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE cascade ON UPDATE no action;