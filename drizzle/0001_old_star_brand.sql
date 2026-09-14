ALTER TABLE `work_items` ADD `health` text DEFAULT 'Đúng tiến độ' NOT NULL;--> statement-breakpoint
ALTER TABLE `work_items` ADD `lifecycle` text DEFAULT 'Đã chốt' NOT NULL;--> statement-breakpoint
ALTER TABLE `work_items` ADD `phase` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `work_items` ADD `company` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `work_items` ADD `follow_person` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `work_items` ADD `next_action` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `work_items` ADD `follow_up_date` text;--> statement-breakpoint
ALTER TABLE `work_items` ADD `start_date` text;--> statement-breakpoint
ALTER TABLE `work_items` ADD `previous_deadline` text;--> statement-breakpoint
ALTER TABLE `work_items` ADD `change_reason` text;--> statement-breakpoint
ALTER TABLE `work_items` ADD `estimated_months` integer;--> statement-breakpoint
ALTER TABLE `work_items` ADD `quantity_progress` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `work_items` ADD `current_holder` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `work_items` ADD `holding_since` text;--> statement-breakpoint
ALTER TABLE `work_items` ADD `contract_value` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `work_items` ADD `amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `work_items` ADD `paid_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `work_items` ADD `payment_round` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `work_items` ADD `skipped_reason` text;--> statement-breakpoint
ALTER TABLE `work_items` ADD `skip_approved` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_work_items_health` ON `work_items` (`health`);--> statement-breakpoint
CREATE INDEX `idx_work_items_follow_up` ON `work_items` (`follow_up_date`);--> statement-breakpoint
CREATE INDEX `idx_work_items_due_date` ON `work_items` (`due_date`);--> statement-breakpoint
PRAGMA optimize;
