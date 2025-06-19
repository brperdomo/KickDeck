import { db } from './db/index.ts';
import { sql } from 'drizzle-orm';

async function fixCalEliteTeams() {
  try {
    console.log('Fixing Cal Elite teams with CALELITE500 discount...\n');
    
    // Get CALELITE500 coupon data
    const couponResult = await db.execute(sql`
      SELECT * FROM coupons WHERE UPPER(code) = 'CALELITE500'
    `);
    
    if (couponResult.rows.length === 0) {
      console.log('CALELITE500 coupon not found');
      return;
    }
    
    const coupon = couponResult.rows[0];
    console.log(`Found coupon: ${coupon.code} ($${coupon.amount})\n`);
    
    // Define Cal Elite teams with their expected discount patterns
    const calEliteTeams = [
      { id: 112, name: 'Cal Elite SC G2015', feeId: 25, expectedFee: 99500, actualPaid: 49500 },
      { id: 113, name: 'Cal Elite SC G2012', feeId: 26, expectedFee: 119500, actualPaid: 69500 },
      { id: 115, name: 'Cal Elite SC G2008', feeId: 26, expectedFee: 119500, actualPaid: 69500 },
      { id: 108, name: 'Cal Elite SC B2007', feeId: 26, expectedFee: 119500, actualPaid: 69500 },
      { id: 107, name: 'Cal Elite SC B2010 / Charlie', feeId: 26, expectedFee: 119500, actualPaid: 69500 },
      { id: 106, name: 'Cal Elite SC B2010-J', feeId: 26, expectedFee: 119500, actualPaid: 69500 },
      { id: 105, name: 'Cal Elite SC B2012', feeId: 26, expectedFee: 119500, actualPaid: 69500 },
      { id: 104, name: 'Cal Elite SC B2016', feeId: 24, expectedFee: 89500, actualPaid: 39500 }
    ];
    
    const couponData = {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discount_type,
      amount: coupon.amount,
      description: coupon.description
    };
    
    let updatedCount = 0;
    
    for (const team of calEliteTeams) {
      const discount = team.expectedFee - team.actualPaid;
      
      console.log(`${team.name} (ID: ${team.id})`);
      console.log(`  Expected fee: $${(team.expectedFee / 100).toFixed(2)}`);
      console.log(`  Actual paid: $${(team.actualPaid / 100).toFixed(2)}`);
      console.log(`  Discount: $${(discount / 100).toFixed(2)}`);
      
      if (discount === 50000) { // $500 discount matches CALELITE500
        // Update the team with coupon data
        await db.execute(sql`
          UPDATE teams 
          SET applied_coupon = ${JSON.stringify(couponData)}
          WHERE id = ${team.id}
        `);
        
        console.log(`  ✓ Updated with CALELITE500 coupon data`);
        updatedCount++;
      } else {
        console.log(`  ⚠ Discount doesn't match CALELITE500 ($500)`);
      }
      console.log('');
    }
    
    // Update CALELITE500 usage count
    if (updatedCount > 0) {
      await db.execute(sql`
        UPDATE coupons 
        SET usage_count = usage_count + ${updatedCount},
            updated_at = NOW()
        WHERE id = ${coupon.id}
      `);
      
      console.log(`Updated CALELITE500 usage count by +${updatedCount}`);
      
      // Get final usage count
      const finalCount = await db.execute(sql`
        SELECT usage_count FROM coupons WHERE id = ${coupon.id}
      `);
      
      console.log(`Final CALELITE500 usage count: ${finalCount.rows[0].usage_count}`);
    }
    
    console.log(`\nSummary: Fixed ${updatedCount} Cal Elite teams`);
    
  } catch (error) {
    console.error('Error fixing Cal Elite teams:', error);
  }
}

fixCalEliteTeams().then(() => process.exit(0)).catch(console.error);