# Comprehensive Data Flow Fixes for Tournament Scheduling

## Critical Issues Identified

### Issue #1: 76 Flights Problem
- **Root Cause**: System creates individual brackets for every (age_group × gender × flight_level) combination
- **Expected**: 8-team groups should create 2 sub-brackets (Pool A + Pool B) under a single flight
- **Current**: Creates 76 separate flight entries instead of logical grouping

### Issue #2: 28 Games vs 13 Games (Double Generation)
- **Root Cause**: Game generation logic treats dual brackets as separate entities
- **Expected**: Pool A (6 games) + Pool B (6 games) + Championship (1 game) = 13 total
- **Current**: Generating 28 games by treating each sub-bracket independently

### Issue #3: TBD Times and Fake Fields  
- **Root Cause**: Scheduler assigning games to non-existent fields (field 10, field 11)
- **Expected**: Use real fields from database: A1, A2, B1, B2, f1-f6, Small1, Small2
- **Current**: Creating placeholder field assignments

### Issue #4: 90-Minute Rest Period Ignored
- **Root Cause**: Rest period validation not enforced during game scheduling
- **Expected**: Teams must have 90+ minutes between games
- **Current**: No rest period validation in scheduling logic

## Data Flow Fixes Required

### Fix #1: Dual Bracket Creation Logic
- Modify bracket creation to handle `group_of_8` as single flight with 2 sub-pools
- Update team assignment to split 8 teams into Pool A (4) and Pool B (4)
- Generate Pool A vs Pool A games, Pool B vs Pool B games, plus 1 championship

### Fix #2: Game Generation Engine  
- Fix `group_of_8` template to generate exactly 13 games:
  - Pool A: 6 round-robin games (4 teams)
  - Pool B: 6 round-robin games (4 teams)  
  - Championship: 1 final game (Pool A winner vs Pool B winner)

### Fix #3: Field Assignment Logic
- Update scheduler to use real fields from database
- Implement field size validation (U13 Girls = 11v11 = f1-f6 only)
- Remove placeholder field generation

### Fix #4: Rest Period Enforcement
- Add 90-minute minimum rest validation between team games
- Implement constraint checking before assigning game times
- Reject schedules that violate rest requirements

## Implementation Priority
1. Fix bracket creation for `group_of_8` template
2. Fix game generation to produce 13 games, not 28
3. Fix field assignment to use real fields only
4. Add rest period validation to scheduling engine

## Next Steps
- Update bracket creation route to handle dual bracket logic
- Fix game generation templates for proper game count
- Update field assignment logic in scheduler
- Add rest period validation before game assignment