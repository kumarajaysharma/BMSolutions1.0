ALTER TABLE vault_secrets ADD COLUMN IF NOT EXISTS "key" text NOT NULL DEFAULT '';
ALTER TABLE vault_secrets ADD COLUMN IF NOT EXISTS "encrypted_value" text NOT NULL DEFAULT '';
ALTER TABLE vault_secrets ALTER COLUMN "masked_value" DROP NOT NULL;