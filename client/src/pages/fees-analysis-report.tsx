import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/layouts/AdminLayout.tsx";
import { usePermissions } from "@/hooks/use-permissions";
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
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from "recharts";
import { 
  ArrowLeft, RefreshCw, BarChart2, AlertCircle, PieChart as PieChartIcon,
  DollarSign, PackageCheck, GaugeCircle
} from "lucide-react";
import { useLocation } from "wouter";

// Format currency values
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount / 100); // Convert cents to dollars
};

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function FeesAnalysisReport() {
  const { hasPermission } = usePermissions();
  const canViewFinancialReports = hasPermission('view_financial_reports');
  const [_location, navigate] = useLocation();
  const [includeAI, setIncludeAI] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch fees analysis data
  const { 
    data: reportData, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['fees-analysis', includeAI],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/reports/fees-analysis?includeAI=${includeAI}`);
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

  // Handler for AI insights toggle
  const handleAIToggle = () => {
    setIncludeAI(!includeAI);
  };

  // Format data for fee type distribution chart
  const formatFeeTypeData = (data) => {
    if (!data || !data.feeTypeDistribution) return [];
    
    return data.feeTypeDistribution.map(item => ({
      name: item.feeType || 'Unknown',
      count: item.count,
      avgAmount: item.avgAmount / 100 // Convert cents to dollars
    }));
  };

  // Format data for top performing fees chart
  const formatTopFeesData = (data) => {
    if (!data || !data.topPerformingFees) return [];
    
    return data.topPerformingFees.slice(0, 5).map(item => ({
      name: `${item.name}`,
      revenue: parseInt(item.total_revenue) / 100, // Convert cents to dollars
      transactions: parseInt(item.transactions),
      feeAmount: parseInt(item.amount) / 100, // Convert cents to dollars
      eventName: item.event_name,
      feeType: item.fee_type
    }));
  };

  // Format data for required vs optional fees chart
  const formatRequiredVsOptionalData = (data) => {
    if (!data || !data.requiredVsOptional) return [];
    
    return data.requiredVsOptional.map(item => ({
      name: item.is_required ? 'Required' : 'Optional',
      count: parseInt(item.fee_count),
      avgAmount: parseInt(item.avg_amount) / 100, // Convert cents to dollars
      totalPotential: parseInt(item.total_potential_value) / 100 // Convert cents to dollars
    }));
  };

  // Calculate total revenue from top performing fees
  const calculateTotalRevenue = (data) => {
    if (!data || !data.topPerformingFees) return 0;
    
    return data.topPerformingFees.reduce((sum, item) => {
      return sum + (parseInt(item.total_revenue) / 100);
    }, 0);
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
              <h1 className="text-2xl font-bold">Fees Analysis Report</h1>
              <p className="text-muted-foreground">
                Analyze fee structure effectiveness and performance
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
                <p>{error instanceof Error ? error.message : "Failed to load fees analysis data"}</p>
              </div>
            </CardContent>
          </Card>
        ) : reportData?.data ? (
          <div className="space-y-6">
            {/* Key Metrics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Fees Created
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {reportData.data.feeStatistics.totalFees}
                    </div>
                    <PackageCheck className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across {reportData.data.feeStatistics.totalEvents} events
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Average Fee Amount
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {formatCurrency(reportData.data.feeStatistics.avgFeeAmount)}
                    </div>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Per fee across all events
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Fee Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {reportData.data.feeTypeDistribution.length}
                    </div>
                    <BarChart2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Different fee types in use
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Top Fee Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {formatCurrency(calculateTotalRevenue(reportData.data) * 100)}
                    </div>
                    <GaugeCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Generated by top fees
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Tabs for different views */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="fee-types">Fee Types</TabsTrigger>
                <TabsTrigger value="top-fees">Top Performing</TabsTrigger>
                <TabsTrigger value="insights">AI Insights</TabsTrigger>
              </TabsList>
              
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Fee Type Distribution</CardTitle>
                      <CardDescription>By number of fees configured</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      {formatFeeTypeData(reportData.data).length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={formatFeeTypeData(reportData.data)}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                              nameKey="name"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {formatFeeTypeData(reportData.data).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value, name, props) => {
                                if (name === 'count') return [value, 'Number of Fees'];
                                return [value, name];
                              }}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex justify-center items-center h-full">
                          <p className="text-muted-foreground">No fee type data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Required vs Optional Fees</CardTitle>
                      <CardDescription>Comparison of fee types</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      {formatRequiredVsOptionalData(reportData.data).length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={formatRequiredVsOptionalData(reportData.data)}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis
                              yAxisId="left"
                              tickFormatter={(value) => `$${value.toLocaleString()}`}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              tickFormatter={(value) => `${value} fees`}
                            />
                            <Tooltip
                              formatter={(value, name) => {
                                if (name === 'avgAmount') return [`$${value.toLocaleString()}`, 'Average Amount'];
                                if (name === 'count') return [value, 'Number of Fees'];
                                if (name === 'totalPotential') return [`$${value.toLocaleString()}`, 'Total Potential Value'];
                                return [value, name];
                              }}
                            />
                            <Legend />
                            <Bar
                              yAxisId="left" 
                              dataKey="avgAmount" 
                              fill="#0088FE" 
                              name="avgAmount"
                            />
                            <Bar
                              yAxisId="right" 
                              dataKey="count" 
                              fill="#82ca9d" 
                              name="count"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex justify-center items-center h-full">
                          <p className="text-muted-foreground">No required vs optional data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Fee Types Tab */}
              <TabsContent value="fee-types" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Fee Type Analysis</CardTitle>
                    <CardDescription>Detailed breakdown by fee type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {formatFeeTypeData(reportData.data).length > 0 ? (
                      <div className="space-y-6">
                        <div className="h-96">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={formatFeeTypeData(reportData.data)}
                              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                              layout="vertical"
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                type="number"
                                tickFormatter={(value) => `$${value.toLocaleString()}`}
                              />
                              <YAxis 
                                dataKey="name" 
                                type="category"
                                width={150}
                              />
                              <Tooltip
                                formatter={(value, name) => {
                                  if (name === 'avgAmount') return [`$${value.toLocaleString()}`, 'Average Amount'];
                                  if (name === 'count') return [value, 'Number of Fees'];
                                  return [value, name];
                                }}
                              />
                              <Legend />
                              <Bar 
                                dataKey="avgAmount" 
                                fill="#0088FE" 
                                name="avgAmount"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-4">Fee Type</th>
                                <th className="text-right py-2 px-4">Count</th>
                                <th className="text-right py-2 px-4">Average Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {formatFeeTypeData(reportData.data).map((item, index) => (
                                <tr key={index} className="border-b hover:bg-muted">
                                  <td className="py-2 px-4">{item.name}</td>
                                  <td className="text-right py-2 px-4">{item.count}</td>
                                  <td className="text-right py-2 px-4">{formatCurrency(item.avgAmount * 100)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center items-center py-8">
                        <p className="text-muted-foreground">No fee type data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Top Performing Fees Tab */}
              <TabsContent value="top-fees" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Fees</CardTitle>
                    <CardDescription>Fees generating the most revenue</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {formatTopFeesData(reportData.data).length > 0 ? (
                      <div className="space-y-6">
                        <div className="h-96">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={formatTopFeesData(reportData.data)}
                              margin={{ top: a
                                llo=20, right: 30, left: 20, bottom: 70 }}
                              layout="vertical"
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                type="number"
                                tickFormatter={(value) => `$${value.toLocaleString()}`}
                              />
                              <YAxis 
                                dataKey="name" 
                                type="category"
                                width={150}
                              />
                              <Tooltip
                                formatter={(value, name) => {
                                  if (name === 'revenue') return [`$${value.toLocaleString()}`, 'Revenue'];
                                  if (name === 'transactions') return [value, 'Transactions'];
                                  return [value, name];
                                }}
                              />
                              <Legend />
                              <Bar 
                                dataKey="revenue" 
                                fill="#0088FE" 
                                name="revenue"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-4">Fee Name</th>
                                <th className="text-left py-2 px-4">Event</th>
                                <th className="text-left py-2 px-4">Type</th>
                                <th className="text-right py-2 px-4">Amount</th>
                                <th className="text-right py-2 px-4">Transactions</th>
                                <th className="text-right py-2 px-4">Revenue</th>
                              </tr>
                            </thead>
                            <tbody>
                              {formatTopFeesData(reportData.data).map((item, index) => (
                                <tr key={index} className="border-b hover:bg-muted">
                                  <td className="py-2 px-4">{item.name}</td>
                                  <td className="py-2 px-4">{item.eventName}</td>
                                  <td className="py-2 px-4">
                                    <Badge variant="outline">{item.feeType}</Badge>
                                  </td>
                                  <td className="text-right py-2 px-4">{formatCurrency(item.feeAmount * 100)}</td>
                                  <td className="text-right py-2 px-4">{item.transactions}</td>
                                  <td className="text-right py-2 px-4">{formatCurrency(item.revenue * 100)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center items-center py-8">
                        <p className="text-muted-foreground">No top fee data available</p>
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
                        <CardDescription>Fee structure insights powered by AI</CardDescription>
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
                    
                    {reportData.aiInsights.paymentMethodTrends && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Fee Type Trends</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {reportData.aiInsights.paymentMethodTrends.map((trend, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{trend.method}</p>
                                  <p className="text-sm text-muted-foreground">{trend.trend}</p>
                                </div>
                                <Badge variant="outline">{trend.percentage}%</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {reportData.aiInsights.seasonalPatterns && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Seasonal Patterns</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-5 space-y-1">
                            {reportData.aiInsights.seasonalPatterns.map((pattern, index) => (
                              <li key={index}>
                                <span className="font-medium">{pattern.season}:</span> {pattern.pattern}
                              </li>
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
                            "We couldn't generate AI insights for this data. This could be due to insufficient fee data." : 
                            "Enable AI insights to view AI-powered analysis of your fee structure."}
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
              <p>No fee analysis data is available.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}