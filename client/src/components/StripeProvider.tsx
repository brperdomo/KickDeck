import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ReactNode } from 'react';

// Load the stripe.js script with your publishable key
// Use the direct key from environment secrets
const stripePromise = loadStripe('pk_test_51R6Ix6CGdBwOWAK0GmV4un3LdaDvGFGsXswjpVFyq5YNM86sO9EiKnbIUMlezs3SalgCJlyDBFnGKS28JuMlRAH600RSLiHpXA');

interface StripeProviderProps {
  children: ReactNode;
}

export default function StripeProvider({ children }: StripeProviderProps) {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}