-- Add enhanced time slot and blackout columns to game_time_slots table
ALTER TABLE game_time_slots 
ADD COLUMN IF NOT EXISTS slot_type VARCHAR(20) DEFAULT 'regular',
ADD COLUMN IF NOT EXISTS blackout_reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS blackout_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS buffer_before INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS buffer_after INTEGER DEFAULT 10;

-- Create index for better blackout querying
CREATE INDEX IF NOT EXISTS idx_game_time_slots_blackout ON game_time_slots(event_id, field_id, slot_type, day_index);

-- Update existing records to have proper slot_type
UPDATE game_time_slots SET slot_type = 'regular' WHERE slot_type IS NULL;