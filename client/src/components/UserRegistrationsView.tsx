import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PaymentStatusBadge, TeamStatusBadge } from '@/components/ui/payment-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Registration {
  id: number;
  teamName: string;
  eventName: string;
  eventId: string;
  ageGroup: string;
  registeredAt: string;
  status: 'registered' | 'approved' | 'rejected' | 'withdrawn';
  amount: number;
  paymentId?: string;
  paymentStatus?: 'paid' | 'pending' | 'failed' | 'refunded';
  paymentDate?: string;
  cardLastFour?: string;
  errorCode?: string;
  errorMessage?: string;
}

export default function UserRegistrationsView() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', 'registrations'],
    queryFn: async () => {
      const response = await fetch('/api/user/registrations');
      if (!response.ok) {
        throw new Error('Failed to fetch registrations');
      }
      return response.json();
    }
  });
  
  // Extract registrations array from the response
  const registrations = data?.registrations || [];

  // Using the centralized status badge components instead of local implementations

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load your registrations. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!registrations || registrations.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Registrations</AlertTitle>
        <AlertDescription>
          You haven't registered for any events yet. Browse our events and register your team today!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Your Registrations</h2>
      
      {registrations.map((registration: Registration) => (
        <Card key={registration.id} className="w-full">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{registration.teamName}</CardTitle>
                <CardDescription>
                  Event: {registration.eventName} | Age Group: {registration.ageGroup}
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2">
                {/* Show both team status and payment status badges using the standardized components */}
                <TeamStatusBadge status={registration.status} />
                <PaymentStatusBadge status={registration.paymentStatus} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Registered on:</span>
                <span className="text-sm">{formatDate(registration.registeredAt)}</span>
              </div>
              
              {/* Show payment details when available */}
              {registration.paymentStatus === 'paid' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Payment ID:</span>
                    <span className="text-sm">{registration.paymentId || 'N/A'}</span>
                  </div>
                  {registration.paymentDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Payment Date:</span>
                      <span className="text-sm">{formatDate(registration.paymentDate)}</span>
                    </div>
                  )}
                  {registration.cardLastFour && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Card:</span>
                      <span className="text-sm">••••{registration.cardLastFour}</span>
                    </div>
                  )}
                </>
              )}
              
              {/* Show error message if payment failed */}
              {registration.paymentStatus === 'failed' && registration.errorMessage && (
                <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-red-700 text-sm">
                  <p className="font-medium">Payment Error:</p>
                  <p>{registration.errorMessage}</p>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="text-sm font-semibold">${(registration.amount / 100).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex justify-between w-full">
              <Button variant="outline" asChild>
                <Link href={`/events/${registration.eventId}`}>View Event</Link>
              </Button>
              
              {/* Only show payment button if payment is still pending */}
              {(registration.paymentStatus === 'pending' || !registration.paymentStatus) && 
                registration.amount > 0 && (
                <Button variant="default" asChild>
                  <Link href={`/events/${registration.eventId}/pay/${registration.id}`}>Complete Payment</Link>
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}