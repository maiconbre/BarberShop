-- Migration: Add slug column to Barbershops table
-- Description: Adds a unique slug column to the Barbershops table for URL-friendly identifiers
-- Date: 2025-08-25

BEGIN;

-- Add slug column to Barbershops table
ALTER TABLE "Barbershops" 
ADD COLUMN "slug" VARCHAR(255) UNIQUE;

-- Create index for performance
CREATE UNIQUE INDEX IF NOT EXISTS "barbershops_slug_idx" ON "Barbershops"("slug");

-- Add comment to explain the column
COMMENT ON COLUMN "Barbershops"."slug" IS 'URL-friendly identifier for the barbershop';

COMMIT;