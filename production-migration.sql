-- Production Database Schema Fix for Event ID Data Type Mismatch
-- This fixes the 500 Internal Server Error in game metadata API endpoints
-- Run this on the production database to resolve scheduling system issues

BEGIN;

-- Step 1: Check current schema state
SELECT 'Checking current schema...' as status;

-- Check event_game_formats table
SELECT 
    column_name, 
    data_type,
    'event_game_formats' as table_name
FROM information_schema.columns 
WHERE table_name = 'event_game_formats' 
AND column_name = 'event_id';

-- Check event_schedule_constraints table  
SELECT 
    column_name, 
    data_type,
    'event_schedule_constraints' as table_name
FROM information_schema.columns 
WHERE table_name = 'event_schedule_constraints' 
AND column_name = 'event_id';

-- Step 2: Fix event_game_formats table if needed
SELECT 'Fixing event_game_formats table...' as status;

-- Drop foreign key constraint if exists
ALTER TABLE event_game_formats 
DROP CONSTRAINT IF EXISTS event_game_formats_event_id_events_id_fk;

-- Convert event_id from text to bigint (safe conversion)
ALTER TABLE event_game_formats 
ALTER COLUMN event_id TYPE bigint USING event_id::bigint;

-- Re-add foreign key constraint
ALTER TABLE event_game_formats 
ADD CONSTRAINT event_game_formats_event_id_events_id_fk 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- Step 3: Fix event_schedule_constraints table if needed
SELECT 'Fixing event_schedule_constraints table...' as status;

-- Drop foreign key constraint if exists
ALTER TABLE event_schedule_constraints 
DROP CONSTRAINT IF EXISTS event_schedule_constraints_event_id_events_id_fk;

-- Convert event_id from text to bigint (safe conversion)
ALTER TABLE event_schedule_constraints 
ALTER COLUMN event_id TYPE bigint USING event_id::bigint;

-- Re-add foreign key constraint
ALTER TABLE event_schedule_constraints 
ADD CONSTRAINT event_schedule_constraints_event_id_events_id_fk 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- Step 4: Verify the fix
SELECT 'Verifying schema fix...' as status;

-- Verify event_game_formats
SELECT 
    column_name, 
    data_type,
    'event_game_formats_AFTER_FIX' as table_name
FROM information_schema.columns 
WHERE table_name = 'event_game_formats' 
AND column_name = 'event_id';

-- Verify event_schedule_constraints
SELECT 
    column_name, 
    data_type,
    'event_schedule_constraints_AFTER_FIX' as table_name
FROM information_schema.columns 
WHERE table_name = 'event_schedule_constraints' 
AND column_name = 'event_id';

-- Step 5: Test the fix with sample query
SELECT 'Testing fix with sample query...' as status;

-- Test query that should work after fix
SELECT COUNT(*) as game_formats_count 
FROM event_game_formats 
WHERE event_id = 1656618593;

SELECT COUNT(*) as schedule_constraints_count 
FROM event_schedule_constraints 
WHERE event_id = 1656618593;

SELECT 'Schema fix completed successfully!' as status;

COMMIT;