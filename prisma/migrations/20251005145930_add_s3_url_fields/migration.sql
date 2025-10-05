-- AddS3UrlFields
ALTER TABLE "events" ADD COLUMN "menu_image_s3_url" VARCHAR(500);
ALTER TABLE "Photos" ADD COLUMN "s3_url" VARCHAR(500);
ALTER TABLE "Recipes" ADD COLUMN "image_s3_url" VARCHAR(500);
