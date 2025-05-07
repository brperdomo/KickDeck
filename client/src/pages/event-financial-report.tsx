import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/layouts/AdminLayout.tsx";
import { usePermissions } from "@/hooks/use-permissions";
import { useLocation, useRoute } from "wouter";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, 
  Line, Legend 
} from "recharts";
import { 
  ArrowLeft, RefreshCw, CalendarRange, DollarSign, 
  Users, ClipboardCheck, BarChart2, AlertCircle, 
  Download, Info, Lightbulb
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

// Format currency values
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount / 100); // Convert cents to dollars
};

// Format date values
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return format(new Date(dateString), 'MMM d, yyyy');
};

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function EventFinancialReport() {
  const { hasPermission } = usePermissions();
  const canViewFinancialReports = hasPermission('view_financial_reports');
  const [_location, navigate] = useLocation();
  const [matched, params] = useRoute("/event-financial-report/:eventId");
  const [includeAI, setIncludeAI] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const eventId = params?.eventId;

  // Fetch event financial data
  const { 
    data: reportData, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['event-financial', eventId, includeAI],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/reports/events/${eventId}/financial?includeAI=${includeAI}`);
      return response.json();
    },
    enabled: !!eventId && canViewFinancialReports,
    refetchOnWindowFocus: false
  });

  if (!canViewFinancialReports) {
    return (
      <AdminLayout>
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to view financial reports.
            </CardDescription>
          </CardHeader>
        </Card>
      </AdminLayout>
    );
  }

  if (!eventId) {
    return (
      <AdminLayout>
        <Card>
          <CardHeader>
            <CardTitle>Invalid Event</CardTitle>
            <CardDescription>
              No event ID was provided. Please select an event to view its financial report.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/admin-dashboard')}>
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </AdminLayout>
    );
  }

  // Handler for AI insights toggle
  const handleAIToggle = () => {
    setIncludeAI(!includeAI);
  };

  // Format data for age group revenue chart
  const formatAgeGroupData = (data) => {
    if (!data || !data.ageGroupRevenue) return [];
    
    return data.ageGroupRevenue.map(item => ({
      name: `${item.age_group} ${item.gender}`,
      revenue: parseInt(item.total_revenue) / 100, // Convert cents to dollars
      teams: parseInt(item.team_count)
    }));
  };

  // Format data for daily revenue chart
  const formatDailyRevenueData = (data) => {
    if (!data || !data.dailyRevenue) return [];
    
    return data.dailyRevenue.map(item => ({
      day: formatDate(item.day),
      revenue: parseInt(item.daily_revenue) / 100, // Convert cents to dollars
      registrations: parseInt(item.daily_registrations)
    }));
  };

  // Calculate registration completion rate
  const calculateCompletionRate = (data) => {
    if (!data || !data.registrations) return 0;
    
    const { totalTeams, paidTeams } = data.registrations;
    if (!totalTeams) return 0;
    
    return Math.round((paidTeams / totalTeams) * 100);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigate('/admin-dashboard')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isLoading ? 'Loading Event...' : 
                 reportData?.data?.event?.name || 'Event Financial Report'}
              </h1>
              <p className="text-muted-foreground">
                Financial performance and registration metrics
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="flex items-center space-x-2">
              <Switch id="ai-toggle" checked={includeAI} onCheckedChange={handleAIToggle} />
              <Label htmlFor="ai-toggle">AI Insights</Label>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : isError ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p>{error instanceof Error ? error.message : "Failed to load event financial data"}</p>
              </div>
            </CardContent>
          </Card>
        ) : reportData?.data ? (
          <div className="space-y-6">
            {/* Event Details Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Event Details</CardTitle>
                <CardDescription>
                  {formatDate(reportData.data.event.startDate)} - {formatDate(reportData.data.event.endDate)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Registration Deadline</span>
                    <span className="font-medium">{formatDate(reportData.data.event.applicationDeadline)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={reportData.data.event.isArchived ? "secondary" : "outline"}>
                      {reportData.data.event.isArchived ? "Archived" : "Active"}
                    </Badge>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Total Revenue</span>
                    <span className="font-medium">{formatCurrency(reportData.data.financials.totalRevenue)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Registration Completion</span>
                    <span className="font-medium">{calculateCompletionRate(reportData.data)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Key Metrics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Teams
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {reportData.data.registrations.totalTeams}
                    </div>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reportData.data.registrations.paidTeams} paid / {reportData.data.registrations.pendingTeams} pending
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {formatCurrency(reportData.data.financials.totalRevenue)}
                    </div>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg. {formatCurrency(reportData.data.financials.avgTransactionAmount)} per team
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {reportData.data.financials.transactionCount}
                    </div>
                    <BarChart2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Payment transactions processed
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Refunds
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {reportData.data.refunds.totalRefunds || 0}
                    </div>
                    <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(reportData.data.refunds.totalRefundAmount || 0)} total refunded
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Tabs for different views */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="age-groups">Age Groups</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="insights">AI Insights</TabsTrigger>
              </TabsList>
              
              {/* Summary Tab */}
              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Revenue by Age Group</CardTitle>
                      <CardDescription>Distribution across age groups</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      {formatAgeGroupData(reportData.data).length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={formatAgeGroupData(reportData.data)}
                            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="name" 
                              angle={-45} 
                              textAnchor="end" 
                              height={70}
                            />
                            <YAxis
                              tickFormatter={(value) => `$${value.toLocaleString()}`}
                            />
                            <Tooltip
                              formatter={(value, name) => {
                                if (name === 'revenue') return [`$${value.toLocaleString()}`, 'Revenue'];
                                if (name === 'teams') return [value, 'Teams'];
                                return [value, name];
                              }}
                            />
                            <Bar 
                              dataKey="revenue" 
                              fill="#0088FE" 
                              name="revenue"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex justify-center items-center h-full">
                          <p className="text-muted-foreground">No age group revenue data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Registration Timeline</CardTitle>
                      <CardDescription>Daily registration and revenue</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      {formatDailyRevenueData(reportData.data).length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={formatDailyRevenueData(reportData.data)}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="day" 
                              angle={-45} 
                              textAnchor="end" 
                              height={70}
                            />
                            <YAxis
                              yAxisId="left"
                              tickFormatter={(value) => `$${value.toLocaleString()}`}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              tickFormatter={(value) => `${value} reg.`}
                            />
                            <Tooltip
                              formatter={(value, name) => {
                                if (name === 'revenue') return [`$${value.toLocaleString()}`, 'Revenue'];
                                if (name === 'registrations') return [value, 'Registrations'];
                                return [value, name];
                              }}
                            />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="revenue"
                              stroke="#0088FE"
                              activeDot={{ r: 8 }}
                              name="revenue"
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="registrations"
                              stroke="#82ca9d"
                              name="registrations"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex justify-center items-center h-full">
                          <p className="text-muted-foreground">No daily revenue data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Age Groups Tab */}
              <TabsContent value="age-groups" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Age Group Revenue Analysis</CardTitle>
                    <CardDescription>Detailed breakdown by age group</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {formatAgeGroupData(reportData.data).length > 0 ? (
                      <div className="space-y-6">
                        <div className="h-96">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={formatAgeGroupData(reportData.data)}
                              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="name" 
                                angle={-45} 
                                textAnchor="end" 
                                height={70}
                              />
                              <YAxis
                                yAxisId="left"
                                tickFormatter={(value) => `$${value.toLocaleString()}`}
                              />
                              <YAxis
                                yAxisId="right"
                                orientation="right"
                                tickFormatter={(value) => `${value} teams`}
                              />
                              <Tooltip
                                formatter={(value, name) => {
                                  if (name === 'revenue') return [`$${value.toLocaleString()}`, 'Revenue'];
                                  if (name === 'teams') return [value, 'Teams'];
                                  return [value, name];
                                }}
                              />
                              <Legend />
                              <Bar 
                                yAxisId="left" 
                                dataKey="revenue" 
                                fill="#0088FE" 
                                name="Revenue"
                              />
                              <Bar 
                                yAxisId="right" 
                                dataKey="teams" 
                                fill="#82ca9d" 
                                name="Teams"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-4">Age Group</th>
                                <th className="text-right py-2 px-4">Teams</th>
                                <th className="text-right py-2 px-4">Revenue</th>
                                <th className="text-right py-2 px-4">Avg. Per Team</th>
                              </tr>
                            </thead>
                            <tbody>
                              {formatAgeGroupData(reportData.data).map((item, index) => (
                                <tr key={index} className="border-b hover:bg-muted">
                                  <td className="py-2 px-4">{item.name}</td>
                                  <td className="text-right py-2 px-4">{item.teams}</td>
                                  <td className="text-right py-2 px-4">{formatCurrency(item.revenue * 100)}</td>
                                  <td className="text-right py-2 px-4">
                                    {item.teams > 0 ? formatCurrency((item.revenue * 100) / item.teams) : 'N/A'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center items-center py-8">
                        <p className="text-muted-foreground">No age group data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Timeline Tab */}
              <TabsContent value="timeline" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Registration Timeline</CardTitle>
                    <CardDescription>Daily registration activity over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {formatDailyRevenueData(reportData.data).length > 0 ? (
                      <div className="space-y-6">
                        <div className="h-96">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={formatDailyRevenueData(reportData.data)}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="day" />
                              <YAxis
                                yAxisId="left"
                                tickFormatter={(value) => `$${value.toLocaleString()}`}
                              />
                              <YAxis
                                yAxisId="right"
                                orientation="right"
                                tickFormatter={(value) => `${value} reg.`}
                              />
                              <Tooltip
                                formatter={(value, name) => {
                                  if (name === 'revenue') return [`$${value.toLocaleString()}`, 'Revenue'];
                                  if (name === 'registrations') return [value, 'Registrations'];
                                  return [value, name];
                                }}
                              />
                              <Legend />
                              <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="revenue"
                                stroke="#0088FE"
                                activeDot={{ r: 8 }}
                                name="Revenue"
                              />
                              <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="registrations"
                                stroke="#82ca9d"
                                name="Registrations"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-4">Date</th>
                                <th className="text-right py-2 px-4">Registrations</th>
                                <th className="text-right py-2 px-4">Revenue</th>
                              </tr>
                            </thead>
                            <tbody>
                              {formatDailyRevenueData(reportData.data).map((item, index) => (
                                <tr key={index} className="border-b hover:bg-muted">
                                  <td className="py-2 px-4">{item.day}</td>
                                  <td className="text-right py-2 px-4">{item.registrations}</td>
                                  <td className="text-right py-2 px-4">{formatCurrency(item.revenue * 100)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center items-center py-8">
                        <p className="text-muted-foreground">No timeline data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* AI Insights Tab */}
              <TabsContent value="insights" className="space-y-4">
                {reportData.aiInsights ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="col-span-1 lg:col-span-2">
                      <CardHeader>
                        <CardTitle>AI Analysis Summary</CardTitle>
                        <CardDescription>Financial insights powered by AI</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {reportData.aiInsights.keyInsights && (
                            <div>
                              <h3 className="text-lg font-semibold mb-2">Key Insights</h3>
                              <ul className="list-disc pl-5 space-y-1">
                                {reportData.aiInsights.keyInsights.map((insight, index) => (
                                  <li key={index}>{insight}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <Separator />
                          
                          {reportData.aiInsights.recommendations && (
                            <div>
                              <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
                              <ul className="list-disc pl-5 space-y-1">
                                {reportData.aiInsights.recommendations.map((recommendation, index) => (
                                  <li key={index}>{recommendation}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {reportData.aiInsights.visualizationCaptions && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Chart Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {reportData.aiInsights.visualizationCaptions.ageGroupRevenue && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <BarChart2 className="h-5 w-5 text-primary" />
                                  <h3 className="font-medium">Age Group Revenue Analysis</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {reportData.aiInsights.visualizationCaptions.ageGroupRevenue}
                                </p>
                              </div>
                            )}
                            
                            {reportData.aiInsights.visualizationCaptions.dailyRevenue && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Lightbulb className="h-5 w-5 text-primary" />
                                  <h3 className="font-medium">Registration Timeline Analysis</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {reportData.aiInsights.visualizationCaptions.dailyRevenue}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {reportData.aiInsights.growthOpportunities && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Growth Opportunities</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-5 space-y-1">
                            {reportData.aiInsights.growthOpportunities.map((opportunity, index) => (
                              <li key={index}>{opportunity}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center justify-center text-center p-6">
                        <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No AI insights available</h3>
                        <p className="text-muted-foreground mt-2">
                          {includeAI ? 
                            "We couldn't generate AI insights for this event. This could be due to insufficient data." : 
                            "Enable AI insights to view AI-powered analysis of this event's financial data."}
                        </p>
                        {!includeAI && (
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={handleAIToggle}
                          >
                            Enable AI Insights
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => navigate('/registration-orders-report')}
              >
                View All Registration Orders
              </Button>
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Data Available</CardTitle>
            </CardHeader>
            <CardContent>
              <p>No financial data is available for this event.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}