-- ============================================================
-- Ajaia Docs — MySQL Schema
-- Run this on your Hostinger VPS MySQL instance
-- ============================================================

CREATE DATABASE IF NOT EXISTS ajaia_docs
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ajaia_docs;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  email       VARCHAR(255) NOT NULL,
  name        VARCHAR(255),
  avatar_url  VARCHAR(1000),
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_email (email),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MAGIC LINKS (passwordless auth tokens)
-- ============================================================
CREATE TABLE IF NOT EXISTS magic_links (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id     CHAR(36)     NOT NULL,
  token       VARCHAR(512) NOT NULL,
  expires_at  DATETIME     NOT NULL,
  used_at     DATETIME     DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_token (token),
  INDEX idx_token   (token),
  INDEX idx_user_id (user_id),
  CONSTRAINT fk_magic_links_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SESSIONS (server-side session tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id     CHAR(36)     NOT NULL,
  token_hash  VARCHAR(256) NOT NULL,
  expires_at  DATETIME     NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_token_hash (token_hash),
  INDEX idx_token_hash (token_hash),
  INDEX idx_user_id    (user_id),
  CONSTRAINT fk_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  owner_id      CHAR(36)     NOT NULL,
  title         VARCHAR(500) NOT NULL DEFAULT 'Untitled Document',
  -- Tiptap JSON content (can be very large for rich docs)
  content       LONGTEXT     DEFAULT NULL,
  -- Plain-text version for word count and future search
  content_text  LONGTEXT     DEFAULT NULL,
  word_count    INT          NOT NULL DEFAULT 0,
  is_deleted    TINYINT(1)   NOT NULL DEFAULT 0,
  deleted_at    DATETIME     DEFAULT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_saved_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_owner_id  (owner_id),
  INDEX idx_deleted   (is_deleted),
  INDEX idx_updated   (updated_at),
  CONSTRAINT fk_documents_owner
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DOCUMENT SHARES
-- ============================================================
CREATE TABLE IF NOT EXISTS document_shares (
  id           CHAR(36)           NOT NULL DEFAULT (UUID()),
  document_id  CHAR(36)           NOT NULL,
  shared_by    CHAR(36)           NOT NULL,
  shared_with  CHAR(36)           NOT NULL,
  permission   ENUM('view','edit') NOT NULL DEFAULT 'view',
  created_at   DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_doc_user (document_id, shared_with),
  INDEX idx_document_id (document_id),
  INDEX idx_shared_with (shared_with),
  INDEX idx_shared_by   (shared_by),
  CONSTRAINT fk_shares_document
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_shares_by
    FOREIGN KEY (shared_by)   REFERENCES users(id)     ON DELETE CASCADE,
  CONSTRAINT fk_shares_with
    FOREIGN KEY (shared_with) REFERENCES users(id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DOCUMENT ATTACHMENTS (uploaded files)
-- ============================================================
CREATE TABLE IF NOT EXISTS document_attachments (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()),
  document_id   CHAR(36)      NOT NULL,
  uploaded_by   CHAR(36)      NOT NULL,
  filename      VARCHAR(500)  NOT NULL,
  original_name VARCHAR(500)  NOT NULL,
  storage_path  VARCHAR(1000) NOT NULL,
  mime_type     VARCHAR(255)  NOT NULL,
  file_size     BIGINT        NOT NULL DEFAULT 0,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_document_id (document_id),
  CONSTRAINT fk_attachments_document
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_attachments_user
    FOREIGN KEY (uploaded_by) REFERENCES users(id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
