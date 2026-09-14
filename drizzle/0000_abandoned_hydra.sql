CREATE TABLE `work_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`project_id` integer,
	`parent_id` integer,
	`code` text DEFAULT '' NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Đang thực hiện' NOT NULL,
	`priority` text DEFAULT 'Trung bình' NOT NULL,
	`owner` text DEFAULT '' NOT NULL,
	`due_date` text,
	`progress` integer DEFAULT 0 NOT NULL,
	`image_path` text,
	`image_title` text,
	`file_name` text,
	`file_url` text,
	`file_storage_status` text DEFAULT 'MISSING_OR_INCORRECT' NOT NULL,
	`file_storage_note` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_work_items_kind` ON `work_items` (`kind`);--> statement-breakpoint
CREATE INDEX `idx_work_items_project_id` ON `work_items` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_work_items_parent_id` ON `work_items` (`parent_id`);--> statement-breakpoint
CREATE INDEX `idx_work_items_file_status` ON `work_items` (`file_storage_status`);--> statement-breakpoint
PRAGMA optimize;
