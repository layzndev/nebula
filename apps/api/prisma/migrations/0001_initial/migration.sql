CREATE TABLE "customers" (
  "id"                    TEXT NOT NULL,
  "email"                 TEXT NOT NULL,
  "display_name"          TEXT,
  "password_hash"         TEXT NOT NULL,
  "status"                TEXT NOT NULL DEFAULT 'active',
  "phantom_tenant_id"     TEXT,
  "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
  "locked_until"          TIMESTAMP(3),
  "last_login_at"         TIMESTAMP(3),
  "created_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"            TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");
CREATE INDEX        "customers_status_idx" ON "customers"("status");

CREATE TABLE "customer_sessions" (
  "id"          TEXT NOT NULL,
  "customer_id" TEXT,
  "data"        JSONB NOT NULL,
  "expires_at"  TIMESTAMP(3) NOT NULL,
  "ip_address"  TEXT,
  "user_agent"  TEXT,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "customer_sessions_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "customer_sessions_customer_id_idx" ON "customer_sessions"("customer_id");
CREATE INDEX "customer_sessions_expires_at_idx" ON "customer_sessions"("expires_at");
