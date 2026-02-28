CREATE TABLE IF NOT EXISTS users (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  first_name     VARCHAR(100) NOT NULL DEFAULT '',
  last_name      VARCHAR(100) NOT NULL DEFAULT '',
  role           ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  avatar_url     VARCHAR(500) DEFAULT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lessons (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cards (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  type        ENUM('new_letter','sound_story','letter_writing','word_reading','book','letter_review','alphabet_song','quick_check','comprehension') NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  title       VARCHAR(255) DEFAULT NULL,
  content     JSON,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lesson_cards (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  lesson_id  INT NOT NULL,
  card_id    INT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE KEY unique_lesson_card (lesson_id, card_id),
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (card_id)   REFERENCES cards(id)   ON DELETE CASCADE
);

INSERT INTO lessons (title, sort_order) VALUES
  ('Lesson 1',  1),  ('Lesson 2',  2),  ('Lesson 3',  3),
  ('Lesson 4',  4),  ('Lesson 5',  5),  ('Lesson 6',  6),
  ('Lesson 7',  7),  ('Lesson 8',  8),  ('Lesson 9',  9),
  ('Lesson 10', 10), ('Lesson 11', 11), ('Lesson 12', 12),
  ('Lesson 13', 13), ('Lesson 14', 14), ('Lesson 15', 15),
  ('Lesson 16', 16), ('Lesson 17', 17), ('Lesson 18', 18),
  ('Lesson 19', 19), ('Lesson 20', 20), ('Lesson 21', 21),
  ('Lesson 22', 22), ('Lesson 23', 23), ('Lesson 24', 24),
  ('Lesson 25', 25), ('Lesson 26', 26), ('Lesson 27', 27),
  ('Lesson 28', 28), ('Lesson 29', 29), ('Lesson 30', 30),
  ('Lesson 31', 31), ('Lesson 32', 32), ('Lesson 33', 33);
