ALTER TABLE "nyhets"
ADD COLUMN IF NOT EXISTS "plats" varchar(255);

ALTER TABLE "nyhets"
ALTER COLUMN "facebook_post_id" TYPE varchar(255)
USING "facebook_post_id"::varchar;
