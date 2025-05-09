import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    // Extract the payment_intent and payment_intent_client_secret from the URL
    const params = new URLSearchParams(window.location.search);
    const paymentIntentId = params.get('payment_intent');
    
    if (!paymentIntentId) {
      toast({
        title: "Payment Error",
        description: "No payment information found.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    // Fetch payment details from our backend
    apiRequest("GET", `/api/payments/payment-intent/${paymentIntentId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to retrieve payment information");
        }
        return res.json();
      })
      .then((data) => {
        setPaymentInfo(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error retrieving payment information:", error);
        toast({
          title: "Payment Verification Error",
          description: "There was an error verifying your payment. Please contact support.",
          variant: "destructive",
        });
        setIsLoading(false);
      });
  }, [toast]);
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Verifying your payment...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-lg mx-auto mt-16 p-8 border rounded-xl shadow-lg text-center">
      <div className="flex justify-center mb-6">
        <CheckCircle2 className="h-20 w-20 text-green-500" />
      </div>
      
      <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
      <p className="text-muted-foreground mb-6">
        Your payment has been processed successfully.
      </p>
      
      {paymentInfo && (
        <div className="bg-muted/50 rounded-lg p-4 my-6 text-left">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-muted-foreground">Amount:</div>
            <div className="font-medium">${((paymentInfo.amount || 0) / 100).toFixed(2)}</div>
            
            <div className="text-muted-foreground">Transaction ID:</div>
            <div className="font-medium truncate">{paymentInfo.id}</div>
            
            <div className="text-muted-foreground">Date:</div>
            <div className="font-medium">
              {new Date(paymentInfo.created * 1000).toLocaleDateString()} {new Date(paymentInfo.created * 1000).toLocaleTimeString()}
            </div>
            
            <div className="text-muted-foreground">Status:</div>
            <div className="font-medium capitalize">{paymentInfo.status}</div>
          </div>
        </div>
      )}
      
      <div className="mt-8 flex flex-col space-y-4">
        <Button asChild size="lg">
          <Link href="/dashboard" className="inline-flex items-center">
            Back to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        
        <p className="text-sm text-muted-foreground">
          A receipt has been sent to your email address.
        </p>
      </div>
    </div>
  );
}