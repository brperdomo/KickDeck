/**
 * Registration Analytics Component
 * 
 * Provides comprehensive registration insights including:
 * - Registration status breakdown (pending, approved, rejected, waitlisted)
 * - Expected revenue calculations with all fees included
 * - Payment projections and collection timeline
 * - Tournament director dashboard for financial planning
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Calendar,
  CreditCard,
  BarChart3,
  Download
} from "lucide-react";

interface RegistrationAnalyticsProps {
  eventId: string;
}

interface RegistrationSummary {
  totalRegistrations: number;
  statusBreakdown: {
    pending: number;
    approved: number;
    rejected: number;
    waitlisted: number;
  };
  revenueProjections: {
    totalExpectedRevenue: number;
    alreadyCollected: number;
    pendingCollection: number;
    potentialRevenue: number; // pending + waitlisted
    averageRegistrationValue: number;
  };
  feeBreakdown: {
    totalRegistrationFees: number;
    totalPlatformFees: number;
    totalStripeFees: number;
    netRevenue: number;
  };
  paymentMethodStats: {
    cardsSaved: number;
    payLaterSelected: number;
    readyToCharge: number;
  };
  dailyRegistrationTrend: Array<{
    date: string;
    registrations: number;
    expectedValue: number;
    status: string;
  }>;
}

export function RegistrationAnalytics({ eventId }: RegistrationAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  // Fetch comprehensive registration analytics
  const { data: analytics, isLoading, error } = useQuery<RegistrationSummary>({
    queryKey: ['registration-analytics', eventId, selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/registration-analytics?period=${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch registration analytics');
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds for live updates
  });

  const handleExportAnalytics = async (format: string = 'csv') => {
    try {
      const response = await fetch(`/api/events/${eventId}/registration-analytics/export?format=${format}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registration-analytics-${eventId}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
        <p>Failed to load registration analytics: {error.message}</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'waitlisted':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-400" />;
    }
  };

  const statusConfig = [
    { key: 'pending', label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800', icon: 'pending' },
    { key: 'approved', label: 'Approved & Paid', color: 'bg-green-100 text-green-800', icon: 'approved' },
    { key: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800', icon: 'rejected' },
    { key: 'waitlisted', label: 'Waitlisted', color: 'bg-blue-100 text-blue-800', icon: 'waitlisted' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Registration Analytics & Revenue Projections</h3>
          <p className="text-sm text-muted-foreground">
            Live insights into all registrations and expected revenue
          </p>
        </div>
        <Button onClick={() => handleExportAnalytics('csv')} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export Analytics
        </Button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-700">Total Registrations</p>
                <p className="text-2xl font-bold text-blue-900">{analytics?.totalRegistrations || 0}</p>
                <p className="text-xs text-blue-600">All submitted forms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-700">Expected Revenue</p>
                <p className="text-2xl font-bold text-green-900">
                  ${analytics?.revenueProjections.totalExpectedRevenue?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-green-600">All registrations if approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/30">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-700">Ready to Charge</p>
                <p className="text-2xl font-bold text-yellow-900">
                  ${analytics?.revenueProjections.pendingCollection?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-yellow-600">Cards saved, pending approval</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/30">
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-700">Average Value</p>
                <p className="text-2xl font-bold text-purple-900">
                  ${analytics?.revenueProjections.averageRegistrationValue?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-purple-600">Per registration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Breakdown</TabsTrigger>
          <TabsTrigger value="status">Status Tracking</TabsTrigger>
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Registration Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Registration Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statusConfig.map((status) => {
                  const count = analytics?.statusBreakdown[status.key as keyof typeof analytics.statusBreakdown] || 0;
                  const percentage = analytics?.totalRegistrations ? (count / analytics.totalRegistrations * 100) : 0;
                  
                  return (
                    <div key={status.key} className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        {getStatusIcon(status.icon)}
                        <span className="ml-2 text-sm font-medium">{status.label}</span>
                      </div>
                      <div className="text-3xl font-bold mb-1">{count}</div>
                      <Badge variant="secondary" className={status.color}>
                        {percentage.toFixed(1)}%
                      </Badge>
                      <Progress value={percentage} className="mt-2 h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Daily Registration Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Registration Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.dailyRegistrationTrend && analytics.dailyRegistrationTrend.length > 0 ? (
                <div className="space-y-3">
                  {analytics.dailyRegistrationTrend.slice(0, 7).map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <span className="font-medium">{new Date(day.date).toLocaleDateString()}</span>
                        <Badge variant="outline">{day.registrations} new</Badge>
                        <Badge variant="secondary">{day.status}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${day.expectedValue.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Expected value</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No recent registration activity
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Projection Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800">Revenue Timeline</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-green-800">Already Collected</span>
                      <span className="font-bold text-green-900">
                        ${analytics?.revenueProjections.alreadyCollected?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm font-medium text-yellow-800">Pending Collection</span>
                      <span className="font-bold text-yellow-900">
                        ${analytics?.revenueProjections.pendingCollection?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-blue-800">Potential (Waitlisted)</span>
                      <span className="font-bold text-blue-900">
                        ${analytics?.revenueProjections.potentialRevenue?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800">Fee Breakdown</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Registration Fees</span>
                      <span className="font-bold">
                        ${analytics?.feeBreakdown.totalRegistrationFees?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Platform Fees</span>
                      <span className="font-bold">
                        ${analytics?.feeBreakdown.totalPlatformFees?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Stripe Processing</span>
                      <span className="font-bold">
                        ${analytics?.feeBreakdown.totalStripeFees?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                      <span className="text-sm font-medium text-green-800">Net Revenue (You Receive)</span>
                      <span className="font-bold text-green-900">
                        ${analytics?.feeBreakdown.netRevenue?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Action Items & Status Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.statusBreakdown?.pending && analytics.statusBreakdown.pending > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800">
                        {analytics.statusBreakdown.pending} registrations awaiting your approval
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 mb-3">
                      These teams have submitted their registration and are ready for review. 
                      Approving them will trigger payment collection.
                    </p>
                    <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                      Review Pending Registrations
                    </Button>
                  </div>
                )}

                {analytics?.statusBreakdown?.waitlisted && analytics.statusBreakdown.waitlisted > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">
                        {analytics.statusBreakdown.waitlisted} teams on waitlist
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      These teams are waiting for spots to open up. You can move them to approved 
                      status when capacity becomes available.
                    </p>
                    <Button size="sm" variant="outline" className="border-blue-600 text-blue-600">
                      Manage Waitlist
                    </Button>
                  </div>
                )}

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      {analytics?.statusBreakdown.approved || 0} teams approved and paid
                    </span>
                  </div>
                  <p className="text-sm text-green-700">
                    These registrations are complete and payments have been processed successfully.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CreditCard className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-900">
                    {analytics?.paymentMethodStats.cardsSaved || 0}
                  </div>
                  <div className="text-sm text-green-700">Cards Saved</div>
                  <div className="text-xs text-green-600 mt-1">Ready to charge on approval</div>
                </div>

                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-900">
                    {analytics?.paymentMethodStats.payLaterSelected || 0}
                  </div>
                  <div className="text-sm text-yellow-700">Pay Later</div>
                  <div className="text-xs text-yellow-600 mt-1">Will need payment collection</div>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-900">
                    {analytics?.paymentMethodStats.readyToCharge || 0}
                  </div>
                  <div className="text-sm text-blue-700">Ready to Charge</div>
                  <div className="text-xs text-blue-600 mt-1">Approved with saved cards</div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Payment Collection Strategy</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Approve registrations with saved cards for immediate collection</li>
                  <li>• Contact "Pay Later" teams to collect payment before final approval</li>
                  <li>• Monitor waitlisted teams for potential capacity openings</li>
                  <li>• Track rejected registrations for event planning improvements</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}