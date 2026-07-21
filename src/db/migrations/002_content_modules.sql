-- Donations, Executives, Gallery, Lodges, Web Content, Programs

CREATE TABLE donations (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  donor        VARCHAR(150) NOT NULL,
  amount_value DECIMAL(12,2) NOT NULL,
  purpose      VARCHAR(255),
  donated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status       ENUM('Pending','Confirmed') NOT NULL DEFAULT 'Pending',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_donations_status (status),
  INDEX idx_donations_date (donated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE executives (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  role       VARCHAR(150) NOT NULL,
  photo      VARCHAR(500),
  state      VARCHAR(100),
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE gallery_items (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  src        VARCHAR(500) NOT NULL,
  caption    VARCHAR(255),
  span       ENUM('wide','tall') NULL,
  public_id  VARCHAR(255),
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lodges (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  photo       VARCHAR(500),
  address     VARCHAR(500),
  state       VARCHAR(100),
  capacity    INT UNSIGNED,
  status      ENUM('Available','Limited','Full') NOT NULL DEFAULT 'Available',
  coordinator VARCHAR(150),
  phone       VARCHAR(30),
  map         VARCHAR(500),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_lodges_status (status),
  INDEX idx_lodges_state (state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE web_content (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  headline   VARCHAR(255) NOT NULL DEFAULT '',
  sections   JSON NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO web_content (id, headline, sections) VALUES (1, '', JSON_ARRAY());

CREATE TABLE programs (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description VARCHAR(1000),
  icon        VARCHAR(100),
  type        ENUM('all','project') NOT NULL DEFAULT 'all',
  link        VARCHAR(500),
  sort_order  INT UNSIGNED NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
