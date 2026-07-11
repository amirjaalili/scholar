-- ====================================================================
-- ELECTRONIC JOURNAL (SCIENTIFIC MAGAZINE) CMS - OPTIMIZED MYSQL SCHEMA
-- Compatible with MySQL 8.0+ / MariaDB 10.5+ (Optimized for Shared Hosting)
-- ====================================================================

-- Enable foreign keys check
SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------------------
-- 1. Table: users
-- Represents users with Role-Based Access Control (RBAC).
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(191) NOT NULL, -- 191 is max safe index key length for utf8mb4 in older MySQL
    `password` VARCHAR(255) NOT NULL, -- Direct bcrypt/argon2 hash storage
    `role` ENUM('admin', 'reviewer', 'author') NOT NULL DEFAULT 'author',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Uniqueness constraint for secure credentials
    UNIQUE KEY `idx_users_email_uniq` (`email`),
    -- Indexing role for high performance RBAC and aggregation queries (e.g. counting authors/reviewers)
    INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 2. Table: articles
-- Represents academic paper submissions.
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `articles` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL, -- Foreign key referencing Author
    `title` VARCHAR(255) NOT NULL,
    `abstract` TEXT NOT NULL,
    `keywords` VARCHAR(255) NOT NULL, -- Comma-separated keywords for full-text or prefix indexing
    `file_path` VARCHAR(255) NOT NULL, -- Relative path to PDF file
    `status` ENUM('Pending', 'Under Review', 'Needs Revision', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign key to enforce integrity and prevent orphaned articles
    CONSTRAINT `fk_articles_user_id` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,

    -- PERFORMANCE INDEXES (Crucial for Shared Hosting)
    INDEX `idx_articles_user_id` (`user_id`), -- Faster dashboard queries for authors
    INDEX `idx_articles_status` (`status`),   -- High-performance admin and public filters
    -- Full-text index on title & abstract for fast search queries
    FULLTEXT KEY `idx_articles_search` (`title`, `abstract`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 3. Table: article_assignments
-- Tracks assignments of reviewers to articles.
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `article_assignments` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `article_id` INT UNSIGNED NOT NULL,
    `reviewer_id` INT UNSIGNED NOT NULL, -- Must point to a user with role = 'reviewer'
    `review_comment` TEXT NULL, -- Reviewer feedback
    `status` ENUM('Approve', 'Reject', 'Request Revision', 'Pending') NOT NULL DEFAULT 'Pending',
    `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `reviewed_at` TIMESTAMP NULL DEFAULT NULL,

    -- Database Integrity constraint - prevents assigning same reviewer twice to same article
    UNIQUE KEY `idx_assignments_article_reviewer` (`article_id`, `reviewer_id`),

    -- Cascade deletions when articles or users are purged
    CONSTRAINT `fk_assignments_article_id`
        FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT `fk_assignments_reviewer_id`
        FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,

    -- PERFORMANCE INDEXES
    INDEX `idx_assignments_article_id` (`article_id`),   -- Fast fetching of reviews per paper
    INDEX `idx_assignments_reviewer_id` (`reviewer_id`), -- Fast loading of articles on Reviewer dashboard
    INDEX `idx_assignments_status` (`status`)             -- Fast filtering of active vs completed reviews
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 4. Initial Seed Data (Useful for testing)
-- Default admin, author and reviewer accounts. Passwords are hash-ready placeholders.
-- --------------------------------------------------------------------
-- INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES
-- ('مدیر کل سامانه', 'admin@journal.ir', 'hash_here', 'admin'),
-- ('دکتر علوی', 'reviewer1@journal.ir', 'hash_here', 'reviewer'),
-- ('دکتر رضایی', 'reviewer2@journal.ir', 'hash_here', 'reviewer'),
-- ('نویسنده مقاله', 'author@journal.ir', 'hash_here', 'author');
