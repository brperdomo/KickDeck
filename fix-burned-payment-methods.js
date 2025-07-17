import { db } from './db/index.js';
import { teams } from './db/schema.js';
import { eq, inArray } from 'drizzle-orm';

async function fixBurnedPaymentMethods() {
  console.log('🔧 FIXING BURNED PAYMENT METHODS');
  
  const affectedTeamIds = [500, 501, 537, 538];
  
  try {
    // Update all affected teams to mark their payment methods as invalid
    const result = await db
      .update(teams)
      .set({
        paymentStatus: 'payment_method_invalid',
        paymentMethodId: null, // Clear the burned payment methods
        notes: 'Payment method was previously used without customer and cannot be reused. Team needs to provide new payment method via payment completion URL.'
      })
      .where(inArray(teams.id, affectedTeamIds))
      .returning({
        id: teams.id,
        name: teams.name,
        paymentStatus: teams.paymentStatus
      });
    
    console.log(`✅ Updated ${result.length} teams with burned payment methods:`);
    
    for (const team of result) {
      console.log(`  - Team ${team.id} (${team.name}): Status set to ${team.paymentStatus}`);
    }
    
    console.log('\n📝 ADMIN ACTION REQUIRED:');
    console.log('For each of these teams, generate a new payment completion URL so they can provide a fresh payment method.');
    console.log('The admin dashboard should show these teams as needing new payment methods.');
    
  } catch (error) {
    console.error('❌ Error fixing burned payment methods:', error);
  }
}

fixBurnedPaymentMethods().catch(console.error);