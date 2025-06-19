import { db } from './db/index.ts';
import { sql } from 'drizzle-orm';

async function verifyCouponFixes() {
  try {
    console.log('Verifying coupon data fixes...\n');
    
    // Check all Cal Elite teams
    const calEliteTeams = await db.execute(sql`
      SELECT 
        t.id,
        t.name,
        t.applied_coupon,
        t.total_amount,
        e.name as event_name
      FROM teams t
      JOIN events e ON t.event_id = e.id
      WHERE t.name ILIKE '%Cal Elite%'
      ORDER BY t.name
    `);
    
    console.log('Cal Elite teams status:');
    calEliteTeams.rows.forEach(team => {
      const hasCoupon = team.applied_coupon ? 'Yes' : 'No';
      let couponInfo = '';
      
      if (team.applied_coupon) {
        try {
          const coupon = JSON.parse(team.applied_coupon);
          couponInfo = ` (${coupon.code}: $${coupon.amount})`;
        } catch (e) {
          couponInfo = ' (coupon data present)';
        }
      }
      
      console.log(`  ${team.name} - $${(team.total_amount / 100).toFixed(2)} - Coupon: ${hasCoupon}${couponInfo}`);
    });
    
    // Check final CALELITE500 usage count
    const couponUsage = await db.execute(sql`
      SELECT code, usage_count FROM coupons WHERE code = 'CALELITE500'
    `);
    
    console.log(`\nCALELITE500 usage count: ${couponUsage.rows[0]?.usage_count || 0}`);
    
    // Count teams with CALELITE500 in database
    const teamsWithCoupon = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM teams
      WHERE applied_coupon::text LIKE '%CALELITE500%'
    `);
    
    console.log(`Teams with CALELITE500 in database: ${teamsWithCoupon.rows[0].count}`);
    
    // Summary of all coupons usage
    console.log('\nAll coupon usage counts:');
    const allCoupons = await db.execute(sql`
      SELECT code, usage_count, is_active
      FROM coupons
      WHERE usage_count > 0 OR code = 'CALELITE500'
      ORDER BY usage_count DESC, code
    `);
    
    allCoupons.rows.forEach(coupon => {
      const status = coupon.is_active ? 'Active' : 'Inactive';
      console.log(`  ${coupon.code}: ${coupon.usage_count} uses (${status})`);
    });
    
  } catch (error) {
    console.error('Error verifying fixes:', error);
  }
}

verifyCouponFixes().then(() => process.exit(0)).catch(console.error);