CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recovery_email VARCHAR(255),
  recovery_email_verified_at TIMESTAMPTZ;
);

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(140) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category VARCHAR(80) NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  unit VARCHAR(40) NOT NULL DEFAULT 'each',
  emoji VARCHAR(12) NOT NULL DEFAULT '🥬',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.auth_action_tokens (
   id BIGSERIAL PRIMARY KEY,
   user_id BIGINT NOT NULL
       REFERENCES public.users(id) ON DELETE CASCADE,
   token_hash CHAR(64) NOT NULL UNIQUE,
   purpose VARCHAR(32) NOT NULL
       CHECK (
           purpose IN (
               'reset_password',
               'verify_recovery_email'
           )
       ),
   expires_at TIMESTAMPTZ NOT NULL,
   used_at TIMESTAMPTZ,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
