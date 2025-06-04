import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  AlertCircle, 
  Mail, 
  Clock, 
  User, 
  Calendar, 
  RefreshCw, 
  Trash2,
  Send,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface IncompleteRegistration {
  userId: number;
  eventId: number;
  submitterName: string;
  submitterEmail: string;
  eventName: string;
  eventStartDate: string;
  eventEndDate: string;
  registrationDeadline: string;
  lastUpdated: string;
  createdAt: string;
  currentStep: string;
  formData: any;
}

interface ReminderResults {
  totalFound: number;
  emailsSent: number;
  emailsFailed: number;
  results: Array<{
    email: string;
    eventName: string;
    success: boolean;
    error?: string;
  }>;
}

export function IncompleteRegistrationsManager() {
  const [reminderHours, setReminderHours] = useState(24);
  const [dryRun, setDryRun] = useState(true);
  const [selectedResults, setSelectedResults] = useState<ReminderResults | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch incomplete registrations
  const { 
    data: incompleteRegs, 
    isLoading: isLoadingRegs, 
    error: regsError,
    refetch: refetchRegs 
  } = useQuery({
    queryKey: ['incomplete-registrations', reminderHours],
    queryFn: async () => {
      const response = await fetch(`/api/admin/incomplete-registrations?hours=${reminderHours}`);
      if (!response.ok) {
        throw new Error('Failed to fetch incomplete registrations');
      }
      const result = await response.json();
      return result.data as IncompleteRegistration[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Send reminder emails mutation
  const sendRemindersMutation = useMutation({
    mutationFn: async ({ hours, isDryRun }: { hours: number; isDryRun: boolean }) => {
      const response = await fetch('/api/admin/send-registration-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reminderThresholdHours: hours,
          dryRun: isDryRun,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send reminder emails');
      }

      const result = await response.json();
      return result.data as ReminderResults;
    },
    onSuccess: (data) => {
      setSelectedResults(data);
      queryClient.invalidateQueries({ queryKey: ['incomplete-registrations'] });
      
      if (dryRun) {
        toast({
          title: "Preview Complete",
          description: `Found ${data.totalFound} incomplete registrations that would receive reminders`,
        });
      } else {
        toast({
          title: "Reminders Sent",
          description: `Successfully sent ${data.emailsSent} reminder emails`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to process reminders: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Clean up expired carts mutation
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cleanup-expired-carts', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to clean up expired carts');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Cleanup Complete",
        description: `Removed ${data.deletedCount} expired registration carts`,
      });
      queryClient.invalidateQueries({ queryKey: ['incomplete-registrations'] });
    },
    onError: (error) => {
      toast({
        title: "Cleanup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStepProgress = (currentStep: string) => {
    const steps = ['age-group', 'team', 'players', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    return `${currentIndex + 1}/4`;
  };

  const handleSendReminders = () => {
    sendRemindersMutation.mutate({
      hours: reminderHours,
      isDryRun: dryRun
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Incomplete Registration Manager
          </CardTitle>
          <CardDescription>
            Track and send reminder emails to users who haven't completed their team registrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="hours">Reminder Threshold (Hours)</Label>
              <Input
                id="hours"
                type="number"
                value={reminderHours}
                onChange={(e) => setReminderHours(parseInt(e.target.value) || 24)}
                min="1"
                max="168"
              />
              <p className="text-sm text-muted-foreground">
                Send reminders for registrations not updated in this many hours
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Preview Mode</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dry-run"
                  checked={dryRun}
                  onCheckedChange={(checked) => setDryRun(checked as boolean)}
                />
                <Label htmlFor="dry-run">Preview only (don't send emails)</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Check this to see what would be sent without actually sending emails
              </p>
            </div>

            <div className="space-y-2">
              <Label>Actions</Label>
              <div className="flex gap-2">
                <Button
                  onClick={handleSendReminders}
                  disabled={sendRemindersMutation.isPending}
                  className="flex-1"
                >
                  {sendRemindersMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : dryRun ? (
                    <Eye className="h-4 w-4 mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {dryRun ? 'Preview' : 'Send Reminders'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => cleanupMutation.mutate()}
                  disabled={cleanupMutation.isPending}
                  title="Clean up expired registration carts"
                >
                  {cleanupMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Results from last action */}
          {selectedResults && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {dryRun ? 'Preview Results' : 'Reminder Results'}
              </AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1">
                  <p>Total incomplete registrations found: {selectedResults.totalFound}</p>
                  {!dryRun && (
                    <>
                      <p>Emails sent successfully: {selectedResults.emailsSent}</p>
                      <p>Emails failed: {selectedResults.emailsFailed}</p>
                    </>
                  )}
                </div>
                
                {selectedResults.results.length > 0 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="link" className="p-0 h-auto mt-2">
                        View detailed results →
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Detailed Results</DialogTitle>
                        <DialogDescription>
                          Results for each incomplete registration
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        {selectedResults.results.map((result, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded"
                          >
                            <div>
                              <p className="font-medium">{result.email}</p>
                              <p className="text-sm text-muted-foreground">{result.eventName}</p>
                            </div>
                            <Badge variant={result.success ? "default" : "destructive"}>
                              {result.success ? 'Success' : 'Failed'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoadingRegs && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading incomplete registrations...
            </div>
          )}

          {/* Error State */}
          {regsError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load incomplete registrations: {regsError.message}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetchRegs()}
                  className="ml-2"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Incomplete Registrations List */}
          {incompleteRegs && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Incomplete Registrations ({incompleteRegs.length})
                </h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetchRegs()}
                  disabled={isLoadingRegs}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {incompleteRegs.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      No incomplete registrations found for the selected time period.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {incompleteRegs.map((reg) => (
                    <Card key={`${reg.userId}-${reg.eventId}`}>
                      <CardContent className="pt-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{reg.submitterName}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{reg.submitterEmail}</p>
                            
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span className="text-sm">{reg.eventName}</span>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <Badge variant="outline">
                                Step {getStepProgress(reg.currentStep)}
                              </Badge>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                Last updated {formatTimeAgo(reg.lastUpdated)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm">
                              <strong>Registration Deadline:</strong> {formatDate(reg.registrationDeadline)}
                            </p>
                            <p className="text-sm">
                              <strong>Event Dates:</strong> {formatDate(reg.eventStartDate)} - {formatDate(reg.eventEndDate)}
                            </p>
                            <p className="text-sm">
                              <strong>Started:</strong> {formatDate(reg.createdAt)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}