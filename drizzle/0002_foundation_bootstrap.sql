CREATE TABLE `foundation_installation` (
	`id` integer PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`instance_id` text NOT NULL,
	`stage` text NOT NULL,
	`bootstrap_id` text NOT NULL,
	`initialized_at` integer NOT NULL
);
