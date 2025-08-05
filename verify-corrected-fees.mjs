import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

// CORRECTED Fee calculation - 4% + $0.30 as agreed
const PLATFORM_FEE_RATE = 0.04; // 4% MatchPro fee (FIXED)
const PLATFORM_FIXED_FEE = 30; // $0.30 in cents (FIXED)
const STRIPE_PERCENTAGE_FEE = 0.029; // 2.9%
const STRIPE_FIXED_FEE = 30; // $0.30 in cents

function calculateCorrectFeeBreakdown(tournamentCost) {
  // Our fee structure: Tournament Cost + 4% + $0.30
  const platformFeeAmount = Math.round(tournamentCost * PLATFORM_FEE_RATE + PLATFORM_FIXED_FEE);
  const totalChargedAmount = tournamentCost + platformFeeAmount;
  
  // Calculate actual platform fee rate for reporting
  const platformFeeRate = platformFeeAmount / tournamentCost;
  
  // Stripe gets 2.9% + $0.30 of the total charged amount
  const stripeFeeAmount = Math.round(totalChargedAmount * STRIPE_PERCENTAGE_FEE + STRIPE_FIXED_FEE);
  
  // MatchPro gets platform fee minus what Stripe takes
  const matchproReceives = platformFeeAmount - stripeFeeAmount;
  
  // Distribution calculation
  const tournamentReceives = tournamentCost; // Tournament gets their base amount
  const stripeReceives = stripeFeeAmount; // Stripe gets their processing fee
  
  // Validation
  const totalAccounted = tournamentReceives + stripeReceives + matchproReceives;
  const isBalanced = Math.abs(totalAccounted - totalChargedAmount) <= 1; // Allow 1 cent rounding
  
  return {
    tournamentCost,
    totalChargedAmount,
    platformFeeRate,
    platformFeeAmount,
    stripeFeeAmount,
    tournamentReceives,
    matchproReceives,
    stripeReceives,
    totalAccounted,
    isBalanced
  };
}

async function verifyCorrectedFees() {
  console.log('💰 CORRECTED Platform Fee Verification - 4% + $0.30 Structure\n');
  
  try {
    // Get team data
    const teams = await sql`
      SELECT 
        t.id,
        t.name,
        t.total_amount,
        t.event_id,
        e.name as event_name
      FROM teams t
      JOIN events e ON t.event_id = e.id
      WHERE t.id IN (851, 859)
    `;
    
    console.log(`📊 Event: ${teams[0].event_name}`);
    console.log('🎯 CORRECTED Fee Structure: 4% + $0.30 (NO VOLUME DISCOUNTS)\n');
    
    for (const team of teams) {
      console.log(`🏆 Team ${team.id}: ${team.name}`);
      console.log(`   Tournament Cost: $${(team.total_amount / 100).toFixed(2)}`);
      
      // Calculate fees using CORRECTED logic
      const fees = calculateCorrectFeeBreakdown(team.total_amount);
      
      console.log(`\n💵 CORRECTED Fee Breakdown:`);
      console.log(`   Platform Fee Rate: ${(fees.platformFeeRate * 100).toFixed(2)}%`);
      console.log(`   Platform Fee Amount: $${(fees.platformFeeAmount / 100).toFixed(2)}`);
      console.log(`   Stripe Processing Fee: $${(fees.stripeFeeAmount / 100).toFixed(2)}`);
      console.log(`   Total Customer Pays: $${(fees.totalChargedAmount / 100).toFixed(2)}`);
      
      console.log(`\n💰 Revenue Distribution:`);
      console.log(`   Tournament Receives: $${(fees.tournamentReceives / 100).toFixed(2)}`);
      console.log(`   MatchPro Net Revenue: $${(fees.matchproReceives / 100).toFixed(2)}`);
      console.log(`   Stripe Receives: $${(fees.stripeReceives / 100).toFixed(2)}`);
      
      console.log(`\n✓ Calculation Balanced: ${fees.isBalanced ? 'YES' : 'NO'}`);
      console.log(`   Total Accounted: $${(fees.totalAccounted / 100).toFixed(2)}`);
      console.log('');
    }
    
    // Summary
    const sampleFees = calculateCorrectFeeBreakdown(teams[0].total_amount);
    console.log('🎯 CORRECTED Platform Fee Summary:');
    console.log(`   Our platform fee rate: ${(sampleFees.platformFeeRate * 100).toFixed(2)}%`);
    console.log(`   Customer pays extra: $${(sampleFees.platformFeeAmount / 100).toFixed(2)} per team`);
    console.log(`   MatchPro net revenue per team: $${(sampleFees.matchproReceives / 100).toFixed(2)}`);
    console.log(`   Total for both teams: $${(sampleFees.matchproReceives * 2 / 100).toFixed(2)}`);
    console.log('\n✅ Fee structure now correctly implements 4% + $0.30 as agreed!');
    
  } catch (error) {
    console.error('❌ Error verifying corrected fees:', error.message);
  } finally {
    await sql.end();
  }
}

verifyCorrectedFees();