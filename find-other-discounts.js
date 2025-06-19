import { db } from './db/index.ts';
import { sql } from 'drizzle-orm';

async function findOtherDiscounts() {
  try {
    console.log('Scanning for other teams with potential discount patterns...\n');
    
    // Get teams without coupon data from Rise Cup and Empire Super Cup
    const teamsWithoutCoupons = await db.execute(sql`
      SELECT 
        t.id,
        t.name,
        t.total_amount,
        e.name as event_name,
        e.id as event_id
      FROM teams t
      JOIN events e ON t.event_id = e.id
      WHERE t.applied_coupon IS NULL
      AND (e.name ILIKE '%Rise Cup%' OR e.name ILIKE '%Empire Super Cup%')
      AND t.total_amount > 100  -- Exclude $1 test registrations
      ORDER BY t.total_amount DESC
    `);
    
    console.log('Teams without coupon data (excluding test registrations):');
    
    // Group by amounts to identify patterns
    const amountGroups = {};
    
    teamsWithoutCoupons.rows.forEach(team => {
      const amount = team.total_amount;
      if (!amountGroups[amount]) {
        amountGroups[amount] = [];
      }
      amountGroups[amount].push(team);
    });
    
    // Look for patterns that might indicate missing coupon data
    const potentialDiscounts = [];
    
    for (const [amount, teams] of Object.entries(amountGroups)) {
      const dollarAmount = parseInt(amount) / 100;
      console.log(`$${dollarAmount.toFixed(2)} - ${teams.length} teams:`);
      
      teams.forEach(team => {
        console.log(`  - ${team.name} (ID: ${team.id}) - ${team.event_name}`);
      });
      
      // Check if this might be a discounted amount
      // Common patterns: 50% discounts would show $597.50 from $1195, $447.50 from $895, etc.
      if (dollarAmount === 597.50 || dollarAmount === 447.50 || dollarAmount === 497.50) {
        potentialDiscounts.push({
          amount: parseInt(amount),
          teams: teams,
          likelyDiscount: 'EMPIREFIFTY (50%)'
        });
      }
      
      console.log('');
    }
    
    if (potentialDiscounts.length > 0) {
      console.log('Potential discount patterns found:');
      potentialDiscounts.forEach(pattern => {
        console.log(`Amount $${(pattern.amount / 100).toFixed(2)} might be ${pattern.likelyDiscount}`);
        console.log(`Teams: ${pattern.teams.map(t => t.name).join(', ')}`);
        console.log('');
      });
    } else {
      console.log('No obvious discount patterns detected in remaining teams.');
    }
    
  } catch (error) {
    console.error('Error scanning for discounts:', error);
  }
}

findOtherDiscounts().then(() => process.exit(0)).catch(console.error);