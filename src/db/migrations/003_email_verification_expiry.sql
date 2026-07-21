ALTER TABLE users
  ADD COLUMN email_verification_expires_at DATETIME NULL AFTER email_verification_token;
