/**
 * Test Team 530 Payment Integrity
 * 
 * This script directly tests the payment integrity system for Team 530
 * which has been experiencing "Setup Intent without customer" errors.
 */

const { Client } = require('pg');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testTeam530PaymentIntegrity() {
  console.log('🧪 TESTING TEAM 530 PAYMENT INTEGRITY');
  console.log('Team: "City SC Southwest G07 DPL"');
  console.log('='.repeat(50));

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    
    // Get Team 530 details
    const teamResult = await client.query(`
      SELECT id, name, status, payment_status, total_amount,
             setup_intent_id, payment_method_id, stripe_customer_id,
             submitter_email, manager_email, manager_name
      FROM teams 
      WHERE id = 530
    `);

    if (teamResult.rows.length === 0) {
      console.log('❌ Team 530 not found');
      return;
    }

    const team = teamResult.rows[0];
    
    console.log('\n📋 CURRENT TEAM STATUS:');
    console.log(`Name: ${team.name}`);
    console.log(`Status: ${team.status}`);
    console.log(`Payment Status: ${team.payment_status}`);
    console.log(`Amount: $${team.total_amount ? (team.total_amount / 100).toFixed(2) : '0.00'}`);
    console.log(`Setup Intent: ${team.setup_intent_id || 'None'}`);
    console.log(`Payment Method: ${team.payment_method_id || 'None'}`);
    console.log(`Customer ID: ${team.stripe_customer_id || 'None'}`);
    console.log(`Contact: ${team.manager_email || team.submitter_email || 'None'}`);

    // Validate payment setup using the same logic as our prevention system
    console.log('\n🔍 PAYMENT SETUP VALIDATION:');
    console.log('-'.repeat(30));

    const issues = [];
    const fixes = [];

    // Check 1: Customer ID
    if (!team.stripe_customer_id) {
      issues.push('Missing Stripe customer ID');
      fixes.push('Create Stripe customer');
    }

    // Check 2: Payment Method
    if (!team.payment_method_id) {
      issues.push('Missing payment method ID');
      fixes.push('Team needs to complete payment setup');
    }

    // Check 3: Setup Intent (if exists)
    if (team.setup_intent_id) {
      try {
        console.log('Checking Setup Intent in Stripe...');
        const setupIntent = await stripe.setupIntents.retrieve(team.setup_intent_id);
        
        console.log(`Setup Intent Status: ${setupIntent.status}`);
        console.log(`Setup Intent Customer: ${setupIntent.customer || 'None'}`);
        console.log(`Setup Intent Payment Method: ${setupIntent.payment_method || 'None'}`);
        
        if (setupIntent.status !== 'succeeded') {
          issues.push(`Setup Intent not completed (status: ${setupIntent.status})`);
          fixes.push('Team needs to complete payment method setup');
        }

        // Check payment method attachment
        if (setupIntent.payment_method && team.stripe_customer_id) {
          try {
            const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method);
            
            console.log(`Payment Method Customer: ${paymentMethod.customer || 'None'}`);
            console.log(`Payment Method Type: ${paymentMethod.type}`);
            
            if (paymentMethod.customer !== team.stripe_customer_id) {
              issues.push('Payment method not attached to team customer');
              fixes.push('Attach payment method to customer');
            }

            if (paymentMethod.type === 'link') {
              issues.push('Link payment method detected (unreliable)');
              fixes.push('Generate new payment URL without Link support');
            }
          } catch (pmError) {
            issues.push(`Payment method validation failed: ${pmError.message}`);
          }
        }
      } catch (siError) {
        issues.push(`Setup Intent validation failed: ${siError.message}`);
        fixes.push('Create new Setup Intent');
      }
    }

    // Report validation results
    console.log('\n📊 VALIDATION RESULTS:');
    console.log(`Issues found: ${issues.length}`);
    console.log(`Can be approved: ${issues.length === 0 ? '✅ YES' : '❌ NO'}`);

    if (issues.length > 0) {
      console.log('\nIssues:');
      issues.forEach(issue => console.log(`  • ${issue}`));
      
      console.log('\nRecommended fixes:');
      fixes.forEach(fix => console.log(`  → ${fix}`));
    }

    // Attempt automatic fix if needed
    if (issues.length > 0) {
      console.log('\n🔧 ATTEMPTING AUTOMATIC FIX:');
      console.log('-'.repeat(30));
      
      const fixActions = [];
      
      // Fix 1: Create customer if missing
      if (!team.stripe_customer_id && (team.submitter_email || team.manager_email)) {
        try {
          const primaryEmail = team.manager_email || team.submitter_email;
          const primaryName = team.manager_name || team.name;
          
          console.log(`Creating Stripe customer for ${primaryEmail}...`);
          
          const customer = await stripe.customers.create({
            email: primaryEmail,
            name: primaryName,
            metadata: {
              teamId: team.id.toString(),
              teamName: team.name,
              autoCreated: 'payment_integrity_fix',
              createdAt: new Date().toISOString()
            }
          });

          await client.query(`
            UPDATE teams 
            SET stripe_customer_id = $1 
            WHERE id = $2
          `, [customer.id, team.id]);

          fixActions.push(`Created Stripe customer ${customer.id}`);
          team.stripe_customer_id = customer.id;
          console.log(`✅ Customer created: ${customer.id}`);
        } catch (customerError) {
          console.log(`❌ Failed to create customer: ${customerError.message}`);
        }
      }

      // Fix 2: Attach payment method to customer if both exist
      if (team.stripe_customer_id && team.setup_intent_id) {
        try {
          const setupIntent = await stripe.setupIntents.retrieve(team.setup_intent_id);
          
          if (setupIntent.payment_method && setupIntent.status === 'succeeded') {
            const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method);
            
            if (paymentMethod.customer !== team.stripe_customer_id && paymentMethod.type !== 'link') {
              console.log(`Attaching payment method ${setupIntent.payment_method} to customer...`);
              
              await stripe.paymentMethods.attach(setupIntent.payment_method, {
                customer: team.stripe_customer_id
              });
              
              fixActions.push(`Attached payment method ${setupIntent.payment_method} to customer ${team.stripe_customer_id}`);
              console.log(`✅ Payment method attached`);
            }
          }
        } catch (attachError) {
          console.log(`❌ Failed to attach payment method: ${attachError.message}`);
        }
      }

      console.log(`\nAuto-fix actions taken: ${fixActions.length}`);
      fixActions.forEach(action => console.log(`  ✅ ${action}`));

      // Re-validate if fixes were applied
      if (fixActions.length > 0) {
        console.log('\n🔍 RE-VALIDATION AFTER AUTO-FIX:');
        console.log('-'.repeat(30));
        
        // Get updated team data
        const updatedTeamResult = await client.query(`
          SELECT stripe_customer_id, payment_method_id, setup_intent_id
          FROM teams WHERE id = 530
        `);
        
        const updatedTeam = updatedTeamResult.rows[0];
        const hasCustomer = !!updatedTeam.stripe_customer_id;
        const hasPaymentMethod = !!updatedTeam.payment_method_id;
        
        console.log(`Customer ID: ${hasCustomer ? '✅ Present' : '❌ Missing'}`);
        console.log(`Payment Method: ${hasPaymentMethod ? '✅ Present' : '❌ Missing'}`);
        
        if (hasCustomer && hasPaymentMethod) {
          console.log('\n✅ SUCCESS! Team 530 is now ready for approval');
          console.log('Payment processing should work correctly');
        } else {
          console.log('\n❌ Team still has issues - manual intervention needed');
        }
      }
    } else {
      console.log('\n✅ Team 530 payment setup is PERFECT!');
      console.log('Ready for approval with no issues.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.end();
  }
}

testTeam530PaymentIntegrity();