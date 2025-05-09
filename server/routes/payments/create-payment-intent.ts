import { Request, Response } from 'express';
import Stripe from 'stripe';

// Initialize Stripe with the secret key from environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

/**
 * Create a general-purpose payment intent for standalone payments
 * This is used for payments that are not associated with a team registration
 */
export async function createGeneralPaymentIntent(req: Request, res: Response) {
  try {
    const { amount } = req.body;
    
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ 
        message: 'Invalid amount provided. Please provide a valid amount.' 
      });
    }
    
    // Create a PaymentIntent with the specified amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: 'general_payment',
        user_id: req.user?.id ? req.user.id.toString() : 'anonymous',
      }
    });
    
    console.log(`Created payment intent: ${paymentIntent.id} for amount: ${amount} cents`);
    
    // Return the client secret to the client
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      message: 'Error creating payment intent', 
      error: error.message 
    });
  }
}

/**
 * Retrieve details of a specific payment intent
 * Used by the payment success page to display payment details
 */
export async function getPaymentIntent(req: Request, res: Response) {
  try {
    const { paymentIntentId } = req.params;
    
    if (!paymentIntentId) {
      return res.status(400).json({ 
        message: 'No payment intent ID provided' 
      });
    }
    
    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Return the payment intent details to the client
    res.status(200).json(paymentIntent);
  } catch (error: any) {
    console.error('Error retrieving payment intent:', error);
    res.status(500).json({ 
      message: 'Error retrieving payment intent', 
      error: error.message 
    });
  }
}

/**
 * Returns the publishable key for use in the frontend
 */
export function getStripeConfig(req: Request, res: Response) {
  if (!process.env.VITE_STRIPE_PUBLIC_KEY) {
    return res.status(500).json({ 
      message: 'Stripe public key not configured' 
    });
  }
  
  res.status(200).json({
    publishableKey: process.env.VITE_STRIPE_PUBLIC_KEY
  });
}