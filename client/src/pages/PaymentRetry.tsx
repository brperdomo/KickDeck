import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import PaymentForm from '@/components/PaymentForm';
import StripeProvider from '@/components/StripeProvider';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeamInfo {
  id: number;
  name: string;
  totalAmount: number;
  paymentStatus: string;
  managerEmail: string;
  eventName?: string;
}

export default function PaymentRetry() {
  const [match, params] = useRoute('/payment/retry/:teamId');
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const { toast } = useToast();

  const teamId = params?.teamId ? parseInt(params.teamId) : null;

  useEffect(() => {
    if (!teamId) {
      setError('Invalid team ID');
      setLoading(false);
      return;
    }

    fetchTeamInfo();
  }, [teamId]);

  const fetchTeamInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teams/${teamId}/payment-info`);
      
      if (!response.ok) {
        throw new Error('Team not found or payment info unavailable');
      }
      
      const data = await response.json();
      setTeamInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team information');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      setIsProcessing(true);
      
      // Notify backend to update team status
      const response = await fetch(`/api/teams/${teamId}/complete-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update team status');
      }

      const result = await response.json();
      
      if (result.success) {
        setPaymentComplete(true);
        toast({
          title: "Payment Completed Successfully!",
          description: "Your team has been approved and you should receive a confirmation email shortly.",
        });
      } else {
        throw new Error(result.error || 'Failed to update team status');
      }
    } catch (error) {
      console.error('Error completing payment:', error);
      toast({
        title: "Payment Processed but Status Update Failed",
        description: "Your payment was successful, but there was an issue updating your team status. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading payment information...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !teamInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Payment Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                {error || 'Unable to load team payment information'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-green-800">Payment Complete!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-left">
              <div className="text-sm text-green-800 font-medium mb-2">Payment Receipt</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Team:</span>
                  <span className="font-medium text-green-900">{teamInfo.name}</span>
                </div>
                {teamInfo.eventName && (
                  <div className="flex justify-between">
                    <span className="text-green-700">Event:</span>
                    <span className="font-medium text-green-900">{teamInfo.eventName}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-green-200">
                  <span className="text-green-700 font-medium">Amount Paid:</span>
                  <span className="font-bold text-green-900">
                    ${(teamInfo.totalAmount / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Your team status has been updated to "Approved" and you should receive a confirmation email shortly.
            </p>
            
            <p className="text-sm text-gray-500">
              You can now close this window.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Team Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Retry Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-yellow-700">Team:</span>
                    <span className="font-medium text-yellow-900">{teamInfo.name}</span>
                  </div>
                  {teamInfo.eventName && (
                    <div className="flex justify-between mb-2">
                      <span className="text-yellow-700">Event:</span>
                      <span className="font-medium text-yellow-900">{teamInfo.eventName}</span>
                    </div>
                  )}
                  <div className="flex justify-between mb-2">
                    <span className="text-yellow-700">Status:</span>
                    <span className="font-medium text-yellow-900">{teamInfo.paymentStatus}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-yellow-200">
                    <span className="text-yellow-700 font-medium">Amount Due:</span>
                    <span className="font-bold text-yellow-900">
                      ${(teamInfo.totalAmount / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="mb-2">Your previous payment attempt failed. Common reasons include:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Insufficient funds</li>
                  <li>Card declined by bank</li>
                  <li>Incorrect card information</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <StripeProvider>
          <PaymentForm
            amount={teamInfo.totalAmount}
            onSuccess={handlePaymentSuccess}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            teamId={teamInfo.id}
            description={`Payment retry for ${teamInfo.name}`}
          />
        </StripeProvider>
      </div>
    </div>
  );
}