/**
 * Fix All Payment Integrity Issues
 * 
 * This script identifies and automatically fixes payment setup issues
 * across all teams to prevent future approval failures.
 */

const { Client } = require('pg');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function fixAllPaymentIntegrityIssues() {
  console.log('🔧 FIXING ALL PAYMENT INTEGRITY ISSUES');
  console.log('='.repeat(50));

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    
    // Find all teams with amounts that might have payment setup issues
    console.log('🔍 Scanning for teams with payment setup issues...');
    
    const teamsResult = await client.query(`
      SELECT id, name, status, payment_status, total_amount,
             setup_intent_id, payment_method_id, stripe_customer_id,
             submitter_email, manager_email, manager_name, submitter_name
      FROM teams 
      WHERE status = 'registered' 
        AND total_amount > 0
        AND (stripe_customer_id IS NULL 
             OR (setup_intent_id IS NOT NULL AND payment_method_id IS NOT NULL))
      ORDER BY created_at DESC
    `);

    console.log(`Found ${teamsResult.rows.length} teams to analyze\n`);

    if (teamsResult.rows.length === 0) {
      console.log('✅ No teams found with payment integrity issues!');
      return;
    }

    let fixedCount = 0;
    let alreadyOkCount = 0;
    let failedCount = 0;

    for (const team of teamsResult.rows) {
      console.log(`\n📋 Team ${team.id}: ${team.name}`);
      console.log(`   Amount: $${(team.total_amount / 100).toFixed(2)}`);
      console.log(`   Customer: ${team.stripe_customer_id || 'Missing'}`);
      console.log(`   Payment Method: ${team.payment_method_id || 'Missing'}`);

      const issues = [];
      const fixActions = [];

      // Check for missing customer ID
      if (!team.stripe_customer_id) {
        issues.push('Missing customer ID');
      }

      // Check Setup Intent and payment method attachment
      if (team.setup_intent_id && team.stripe_customer_id) {
        try {
          const setupIntent = await stripe.setupIntents.retrieve(team.setup_intent_id);
          
          if (setupIntent.payment_method && setupIntent.status === 'succeeded') {
            const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method);
            
            if (paymentMethod.customer !== team.stripe_customer_id) {
              issues.push('Payment method not attached to customer');
            }
          }
        } catch (error) {
          console.log(`   ⚠️  Stripe validation error: ${error.message}`);
        }
      }

      if (issues.length === 0) {
        console.log('   ✅ Already OK - no issues found');
        alreadyOkCount++;
        continue;
      }

      console.log(`   ❌ Issues: ${issues.join(', ')}`);
      console.log('   🔧 Applying fixes...');

      try {
        // Fix 1: Create customer if missing
        if (!team.stripe_customer_id) {
          const primaryEmail = team.manager_email || team.submitter_email;
          const primaryName = team.manager_name || team.submitter_name || team.name;
          
          if (primaryEmail) {
            const customer = await stripe.customers.create({
              email: primaryEmail,
              name: primaryName,
              metadata: {
                teamId: team.id.toString(),
                teamName: team.name,
                autoCreated: 'payment_integrity_batch_fix',
                createdAt: new Date().toISOString()
              }
            });

            await client.query(`
              UPDATE teams 
              SET stripe_customer_id = $1 
              WHERE id = $2
            `, [customer.id, team.id]);

            fixActions.push(`Created customer ${customer.id}`);
            team.stripe_customer_id = customer.id;
          } else {
            console.log('   ❌ Cannot create customer - no email address');
            failedCount++;
            continue;
          }
        }

        // Fix 2: Attach payment method to customer
        if (team.setup_intent_id && team.stripe_customer_id) {
          try {
            const setupIntent = await stripe.setupIntents.retrieve(team.setup_intent_id);
            
            if (setupIntent.payment_method && setupIntent.status === 'succeeded') {
              const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method);
              
              if (paymentMethod.customer !== team.stripe_customer_id && paymentMethod.type !== 'link') {
                await stripe.paymentMethods.attach(setupIntent.payment_method, {
                  customer: team.stripe_customer_id
                });
                
                fixActions.push(`Attached payment method to customer`);
              }
            }
          } catch (attachError) {
            console.log(`   ⚠️  Payment method attachment failed: ${attachError.message}`);
          }
        }

        if (fixActions.length > 0) {
          console.log(`   ✅ Fixed: ${fixActions.join(', ')}`);
          fixedCount++;
        } else {
          console.log('   ⚠️  No fixes applied');
        }

      } catch (error) {
        console.log(`   ❌ Fix failed: ${error.message}`);
        failedCount++;
      }
    }

    console.log('\n📊 BATCH FIX SUMMARY:');
    console.log('='.repeat(30));
    console.log(`Teams scanned: ${teamsResult.rows.length}`);
    console.log(`Already OK: ${alreadyOkCount}`);
    console.log(`Fixed: ${fixedCount}`);
    console.log(`Failed: ${failedCount}`);
    console.log(`Success rate: ${((alreadyOkCount + fixedCount) / teamsResult.rows.length * 100).toFixed(1)}%`);

    if (fixedCount > 0) {
      console.log(`\n✅ FIXED ${fixedCount} TEAMS!`);
      console.log('These teams are now ready for approval without payment errors.');
      console.log('The "Setup Intent without customer" issue should be resolved.');
    }

    if (failedCount > 0) {
      console.log(`\n⚠️  ${failedCount} teams still need manual attention.`);
    }

  } catch (error) {
    console.error('❌ Batch fix failed:', error);
  } finally {
    await client.end();
  }
}

fixAllPaymentIntegrityIssues();