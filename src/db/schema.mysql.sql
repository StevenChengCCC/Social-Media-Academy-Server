-- Create database & user (run as admin, adjust host/pwd):
-- CREATE DATABASE sma DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CREATE USER 'sma_user'@'%' IDENTIFIED BY 'strong_password_here';
-- GRANT ALL PRIVILEGES ON sma.* TO 'sma_user'@'%';
-- FLUSH PRIVILEGES;

-- Tables
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  cognito_sub VARCHAR(64) NOT NULL UNIQUE,
  display_name VARCHAR(120),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS courses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  summary TEXT,
  cover_image_url VARCHAR(512),
  is_published TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lessons (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  course_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lessons_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS steps (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  lesson_id BIGINT UNSIGNED NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  text_md TEXT NOT NULL,
  image_url VARCHAR(512),
  est_seconds INT DEFAULT 30,
  CONSTRAINT fk_steps_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  INDEX idx_steps_lesson_order (lesson_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS progress (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  lesson_id BIGINT UNSIGNED NOT NULL,
  last_step_index INT NOT NULL DEFAULT 0,
  completed TINYINT(1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_lesson (user_id, lesson_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed example
INSERT INTO courses (title, slug, summary, is_published) VALUES
  ('Instagram 入门', 'instagram-basics', '创建账号并设置双重验证', 1)
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO lessons (course_id, title, order_index, summary)
SELECT c.id, '账号与安全', 1, '注册、强密码、两步验证' FROM courses c WHERE c.slug='instagram-basics'
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO steps (lesson_id, order_index, text_md, image_url, est_seconds)
SELECT l.id, 1, '在商店搜索 Instagram 并注册。', NULL, 30 FROM lessons l
  JOIN courses c ON l.course_id=c.id AND c.slug='instagram-basics'
ON DUPLICATE KEY UPDATE text_md=VALUES(text_md);