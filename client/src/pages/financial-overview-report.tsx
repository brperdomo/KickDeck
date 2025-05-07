import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/layouts/AdminLayout.tsx";
import { usePermissions } from "@/hooks/use-permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { ArrowUpRight, ArrowDownRight, DollarSign, Calendar, BarChart2, PieChart as PieChartIcon, AlertCircle, Download, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";

// Format currency values
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount / 100); // Convert cents to dollars
};

// Period options
const periodOptions = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'year', label: 'Last Year' },
  { value: 'all', label: 'All Time' }
];

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function FinancialOverviewReport() {
  const { hasPermission } = usePermissions();
  const canViewFinancialReports = hasPermission('view_financial_reports');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [includeAI, setIncludeAI] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  // Fetch financial overview data
  const { 
    data: reportData, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['financial-overview', selectedPeriod, includeAI],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/reports/financial-overview?period=${selectedPeriod}&includeAI=${includeAI}`);
      return response.json();
    },
    enabled: canViewFinancialReports,
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

  // Handler for period change
  const handlePeriodChange = (newPeriod) => {
    setSelectedPeriod(newPeriod);
  };

  // Handler for AI insights toggle
  const handleAIToggle = () => {
    setIncludeAI(!includeAI);
  };

  // Format data for revenue by month chart
  const formatMonthlyRevenueData = (data) => {
    if (!data || !data.monthlyRevenueTrend) return [];
    
    return data.monthlyRevenueTrend.map(item => ({
      month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: item.total_revenue / 100, // Convert cents to dollars
      count: parseInt(item.transaction_count)
    }));
  };

  // Format data for payment methods pie chart
  const formatPaymentMethodsData = (data) => {
    if (!data || !data.paymentMethods) return [];
    
    return data.paymentMethods.map(method => ({
      name: method.paymentMethod || 'Unknown',
      value: method.totalAmount / 100 // Convert cents to dollars
    }));
  };

  // Format data for top events bar chart
  const formatTopEventsData = (data) => {
    if (!data || !data.topEvents) return [];
    
    return data.topEvents.map(event => ({
      name: event.eventName || 'Unknown Event',
      revenue: event.revenue / 100, // Convert cents to dollars
      count: parseInt(event.transactionCount)
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold">Financial Overview</h1>
            <p className="text-muted-foreground">
              Comprehensive analysis of your financial performance
            </p>
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <Button
              variant={includeAI ? "default" : "outline"}
              onClick={handleAIToggle}
              title={includeAI ? "Disable AI insights" : "Enable AI insights"}
            >
              {includeAI ? "AI Enabled" : "AI Disabled"}
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
                <p>{error instanceof Error ? error.message : "Failed to load financial data"}</p>
              </div>
            </CardContent>
          </Card>
        ) : reportData ? (
          <div className="space-y-6">
            {/* Key Metrics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {formatCurrency(reportData.data.revenue.totalRevenue)}
                    </div>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {periodOptions.find(p => p.value === selectedPeriod)?.label}
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
                      {reportData.data.revenue.transactionCount}
                    </div>
                    <BarChart2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg. {formatCurrency(reportData.data.revenue.avgTransactionValue)} per transaction
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
                    <ArrowDownRight className={`h-4 w-4 ${reportData.data.refunds.totalRefunds > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(reportData.data.refunds.totalRefundAmount || 0)} total refunded
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Time Period
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {periodOptions.find(p => p.value === selectedPeriod)?.label}
                    </div>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(reportData.data.timeRange.start), { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Tabs for different views */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="events">Top Events</TabsTrigger>
                <TabsTrigger value="insights">AI Insights</TabsTrigger>
              </TabsList>
              
              {/* Summary Tab */}
              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Revenue Over Time</CardTitle>
                      <CardDescription>Monthly revenue trend</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={formatMonthlyRevenueData(reportData.data)}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis
                            yAxisId="left"
                            tickFormatter={(value) => `$${value.toLocaleString()}`}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tickFormatter={(value) => `${value} txns`}
                          />
                          <Tooltip
                            formatter={(value, name) => {
                              if (name === 'revenue') return [`$${value.toLocaleString()}`, 'Revenue'];
                              if (name === 'count') return [value, 'Transactions'];
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
                            dataKey="count"
                            stroke="#82ca9d"
                            name="count"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Payment Methods</CardTitle>
                      <CardDescription>Distribution by revenue</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={formatPaymentMethodsData(reportData.data)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {formatPaymentMethodsData(reportData.data).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Trends Tab */}
              <TabsContent value="trends" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trends</CardTitle>
                    <CardDescription>Monthly revenue and transaction count</CardDescription>
                  </CardHeader>
                  <CardContent className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={formatMonthlyRevenueData(reportData.data)}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis
                          yAxisId="left"
                          tickFormatter={(value) => `$${value.toLocaleString()}`}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tickFormatter={(value) => `${value} txns`}
                        />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === 'revenue') return [`$${value.toLocaleString()}`, 'Revenue'];
                            if (name === 'count') return [value, 'Transactions'];
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
                          dataKey="count"
                          stroke="#82ca9d"
                          name="count"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Top Events Tab */}
              <TabsContent value="events" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Events by Revenue</CardTitle>
                    <CardDescription>Highest performing events in the selected period</CardDescription>
                  </CardHeader>
                  <CardContent className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={formatTopEventsData(reportData.data)}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                        <YAxis dataKey="name" type="category" width={150} />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === 'revenue') return [`$${value.toLocaleString()}`, 'Revenue'];
                            if (name === 'count') return [value, 'Registrations'];
                            return [value, name];
                          }}
                        />
                        <Bar dataKey="revenue" fill="#0088FE" name="revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" onClick={() => window.location.href = '/registration-orders-report'}>
                      View Full Registration Report
                    </Button>
                  </CardFooter>
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
                    
                    {reportData.aiInsights.topRevenueEvents && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Top Performing Events</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {reportData.aiInsights.topRevenueEvents.map((event, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{event.eventName}</p>
                                  <p className="text-sm text-muted-foreground">{event.registrationCount} registrations</p>
                                </div>
                                <Badge variant="outline">{formatCurrency(event.revenue)}</Badge>
                              </div>
                            ))}
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
                            "We couldn't generate AI insights for this data set. Try selecting a different time period with more transactions." : 
                            "Enable AI insights to view AI-powered analysis of your financial data."}
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
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Data Available</CardTitle>
            </CardHeader>
            <CardContent>
              <p>No financial data is available for the selected period.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}