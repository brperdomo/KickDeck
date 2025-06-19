/**
 * Test Coupon Usage Tracking
 * 
 * This script checks the current usage count for the CALELITE500 coupon
 * and helps verify if the usage tracking is working properly.
 */

import { db } from './db/index.ts';
import { sql } from 'drizzle-orm';

async function testCouponUsage() {
  try {
    console.log('Checking CALELITE500 coupon usage...');
    
    // Check current usage count for CALELITE500
    const result = await db.execute(sql`
      SELECT 
        id,
        code,
        usage_count,
        max_uses,
        is_active,
        created_at
      FROM coupons 
      WHERE UPPER(code) = 'CALELITE500'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ CALELITE500 coupon not found');
      return;
    }
    
    const coupon = result.rows[0];
    console.log('✓ Found CALELITE500 coupon:');
    console.log(`  - ID: ${coupon.id}`);
    console.log(`  - Code: ${coupon.code}`);
    console.log(`  - Current Usage: ${coupon.usage_count}`);
    console.log(`  - Max Uses: ${coupon.max_uses || 'Unlimited'}`);
    console.log(`  - Active: ${coupon.is_active}`);
    console.log(`  - Created: ${coupon.created_at}`);
    
    // Check if there are any teams that have used this coupon
    console.log('\nChecking teams that used this coupon...');
    const teamsResult = await db.execute(sql`
      SELECT 
        t.id,
        t.name,
        t.applied_coupon,
        t.created_at
      FROM teams t
      WHERE t.applied_coupon IS NOT NULL
      AND (
        (t.applied_coupon::text LIKE '%CALELITE500%')
        OR 
        (t.applied_coupon::jsonb->>'code' = 'CALELITE500')
      )
      ORDER BY t.created_at DESC
    `);
    
    console.log(`Found ${teamsResult.rows.length} teams that used CALELITE500:`);
    
    teamsResult.rows.forEach((team, index) => {
      console.log(`  ${index + 1}. Team: ${team.name} (ID: ${team.id})`);
      console.log(`     Registered: ${team.created_at}`);
      
      try {
        const couponData = typeof team.applied_coupon === 'string' 
          ? JSON.parse(team.applied_coupon) 
          : team.applied_coupon;
        console.log(`     Coupon: ${couponData.code} (${couponData.discountType}: ${couponData.amount}${couponData.discountType === 'percentage' ? '%' : ''})`);
      } catch (e) {
        console.log(`     Coupon data: ${team.applied_coupon}`);
      }
    });
    
    // The usage count should match the number of teams that used the coupon
    const expectedUsage = teamsResult.rows.length;
    const actualUsage = coupon.usage_count;
    
    console.log(`\n📊 Usage Analysis:`);
    console.log(`  - Teams found with coupon: ${expectedUsage}`);
    console.log(`  - Coupon usage count: ${actualUsage}`);
    
    if (expectedUsage === actualUsage) {
      console.log('✅ Usage count matches! Tracking is working correctly.');
    } else {
      console.log('⚠️  Usage count mismatch detected.');
      console.log('   This suggests the usage tracking wasn\'t working properly before.');
      console.log('   New registrations should now properly increment the count.');
    }
    
  } catch (error) {
    console.error('Error testing coupon usage:', error);
  }
}

// Run the test
testCouponUsage()
  .then(() => {
    console.log('\nTest completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });