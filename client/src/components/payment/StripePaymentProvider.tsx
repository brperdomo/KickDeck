import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

/**
 * Resolve Stripe publishable key from env vars or server API, then load Stripe.
 * Cached so the fetch + loadStripe only happen once across the entire app.
 */
let _stripePromise: Promise<Stripe | null> | null = null;

function getStripePromise(): Promise<Stripe | null> {
  if (_stripePromise) return _stripePromise;

  _stripePromise = (async () => {
    // 1. Check server-injected key
    let key = (window as any).__STRIPE_PK__;

    // 2. Try env vars
    if (!key) {
      key = import.meta.env.VITE_STRIPE_PUBLIC_KEY ||
        import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    }

    // 3. Fall back to server API (database-stored keys)
    if (!key) {
      try {
        const response = await fetch('/api/payments/config');
        if (response.ok) {
          const config = await response.json();
          key = config.publishableKey;
        }
      } catch (error) {
        console.error('Failed to fetch Stripe config from server:', error);
      }
    }

    if (!key) {
      console.error('Stripe publishable key not found (checked env vars and server API)');
      return null;
    }

    return loadStripe(key);
  })();

  return _stripePromise;
}

interface StripePaymentProviderProps {
  children: React.ReactNode;
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
  teamId?: number;
  eventId?: string;
  ageGroupId?: string;
}

export default function StripePaymentProvider({
  children,
  amount,
  currency = 'usd',
  description,
  metadata = {},
  teamId,
  eventId,
  ageGroupId,
}: StripePaymentProviderProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const { toast } = useToast();

  // Resolve Stripe (env var or server API) on mount
  useEffect(() => {
    setStripePromise(getStripePromise());
  }, []);

  useEffect(() => {
    // Create payment intent when the component mounts
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Skip creating payment intent if amount is 0
        if (amount <= 0) {
          setIsLoading(false);
          return;
        }

        // Create a payment intent on the server
        const response = await apiRequest('POST', '/api/payments/create-intent', {
          amount,
          currency,
          description,
          metadata: {
            ...metadata,
            description: description || 'Team registration payment',
          },
          teamId,
          eventId,
          ageGroupId,
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(errorData || 'Failed to create payment intent');
        }

        const data = await response.json();
        
        if (!data.clientSecret) {
          throw new Error('No client secret returned from the server');
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize payment');
        
        toast({
          title: 'Payment Error',
          description: err instanceof Error ? err.message : 'Failed to initialize payment',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [amount, currency, description, metadata, teamId, eventId, ageGroupId, toast]);

  // Configure Stripe Elements
  const options: StripeElementsOptions = {
    clientSecret: clientSecret || undefined,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#7c3aed', // Primary color (purple)
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
    paymentMethodOrder: ['card'],
    wallets: {
      amazonPay: 'never'
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
        <h3 className="font-semibold mb-2">Payment Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (isLoading || !stripePromise || !clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Initializing payment system...</p>
      </div>
    );
  }

  // Skip payment UI if amount is 0
  if (amount <= 0) {
    return <>{children}</>;
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}