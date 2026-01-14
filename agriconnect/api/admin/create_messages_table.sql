-- Script SQL pour créer la table messages_admin
-- Cette table permet de stocker les messages, plaintes et suggestions des utilisateurs

CREATE TABLE IF NOT EXISTS messages_admin (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    type VARCHAR(50) NOT NULL COMMENT 'PLAINTE, SUGGESTION, BUG, AMELIORATION',
    sujet VARCHAR(255),
    message TEXT NOT NULL,
    is_lu TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_type (type),
    INDEX idx_is_lu (is_lu),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

