ALTER TABLE "sets" ADD COLUMN "client_mutation_id" text;--> statement-breakpoint
ALTER TABLE "sets" ADD CONSTRAINT "sets_user_id_client_mutation_id_unique" UNIQUE("user_id","client_mutation_id");