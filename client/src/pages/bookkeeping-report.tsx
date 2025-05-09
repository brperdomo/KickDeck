import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  Download, 
  Filter, 
  Loader2, 
  RefreshCw, 
  Search,
  DollarSign,
  Calendar,
  CreditCard,
  RotateCcw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose 
} from "@/components/ui/sheet";
import DatePicker from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Get the payment status badge variant
const getStatusBadge = (status: string) => {
  switch(status) {
    case 'succeeded':
      return { variant: 'default' as const, label: 'Succeeded' };
    case 'pending':
      return { variant: 'outline' as const, label: 'Pending' };
    case 'failed':
      return { variant: 'destructive' as const, label: 'Failed' };
    case 'refunded':
    case 'partial_refund':
      return { variant: 'secondary' as const, label: 'Refunded' };
    case 'chargeback':
      return { variant: 'destructive' as const, label: 'Chargeback' };
    default:
      return { variant: 'outline' as const, label: status.charAt(0).toUpperCase() + status.slice(1) };
  }
};

export default function BookkeepingReport() {
  const [_, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all-transactions');
  
  // Date range filter
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  
  // Additional filters
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string | null>(null);
  const [showSettledOnly, setShowSettledOnly] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  // Query bookkeeping report data
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['bookkeepingReport', activeTab, startDate, endDate, showSettledOnly],
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      if (showSettledOnly) params.append('settledOnly', 'true');
      params.append('reportType', activeTab);
      
      const response = await fetch(`/api/reports/bookkeeping?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch bookkeeping report');
      }
      return response.json();
    },
  });
  
  // Query available events for filter
  const { data: eventsData } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      return response.json();
    },
  });
  
  const transactions = data?.transactions || [];
  const events = eventsData?.events || [];
  
  // Calculate summary statistics
  const summary = data?.summary || {
    totalTransactions: 0,
    totalAmount: 0,
    stripeFees: 0,
    netAmount: 0
  };

  // Apply client-side filters (beyond the date range and tab filters)
  const filteredTransactions = transactions.filter((transaction: any) => {
    // Text search
    const searchTerms = searchQuery.toLowerCase().split(' ');
    const searchFields = [
      transaction.team_name || '',
      transaction.event_name || '',
      transaction.manager_name || '',
      transaction.manager_email || '',
      transaction.age_group || '',
      transaction.payment_method || '',
      transaction.status || '',
      transaction.payment_intent_id || '',
      transaction.club_name || ''
    ].map(field => field.toLowerCase());
    
    const matchesSearch = searchTerms.every(term => 
      searchFields.some(field => field.includes(term))
    );
    
    // Status filter
    const matchesStatus = !statusFilter || transaction.status === statusFilter;
    
    // Payment method filter
    const matchesPaymentMethod = !paymentMethodFilter || transaction.payment_method === paymentMethodFilter;
    
    // Event filter
    const matchesEvent = !selectedEventId || transaction.event_id === selectedEventId;
    
    return matchesSearch && matchesStatus && matchesPaymentMethod && matchesEvent;
  });

  // Get unique payment methods and statuses for filters
  const statusMap: Record<string, boolean> = {};
  const paymentMethodMap: Record<string, boolean> = {};
  
  transactions.forEach((t: any) => {
    if (t.status) statusMap[t.status] = true;
    if (t.payment_method) paymentMethodMap[t.payment_method] = true;
  });
  
  const uniqueStatuses = Object.keys(statusMap);
  const uniquePaymentMethods = Object.keys(paymentMethodMap);

  // Handle export function for the current view
  const handleExport = () => {
    if (!filteredTransactions.length) return;
    
    try {
      // Define CSV headers based on active tab
      let headers = [
        "Transaction ID", 
        "Date", 
        "Team Name",
        "Event Name",
        "Payment Method", 
        "Gross Amount", 
        "Stripe Fee",
        "Net Amount",
        "Status", 
        "Settlement Date",
        "Manager Email"
      ];
      
      if (activeTab === 'refunds') {
        headers = [
          "Transaction ID",
          "Original Payment ID", 
          "Date", 
          "Team Name",
          "Event Name",
          "Refund Amount", 
          "Refund Reason",
          "Refund Type",
          "Original Amount"
        ];
      } else if (activeTab === 'chargebacks') {
        headers = [
          "Transaction ID", 
          "Original Payment ID",
          "Date", 
          "Team Name",
          "Event Name",
          "Chargeback Amount", 
          "Dispute Status",
          "Dispute Reason"
        ];
      } else if (activeTab === 'pending-payments') {
        headers = [
          "Transaction ID", 
          "Date", 
          "Team Name",
          "Event Name",
          "Amount Due", 
          "Status",
          "Manager Email",
          "Manager Phone"
        ];
      }
      
      // Create CSV rows based on active tab
      const rows = filteredTransactions.map((transaction: any) => {
        if (activeTab === 'refunds') {
          return [
            transaction.id,
            transaction.original_payment_id || 'N/A',
            formatDate(transaction.created_at),
            transaction.team_name || 'N/A',
            transaction.event_name || 'N/A',
            formatCurrency(transaction.amount),
            transaction.refund_reason || 'N/A',
            transaction.is_partial ? 'Partial' : 'Full',
            formatCurrency(transaction.original_amount || 0)
          ];
        } else if (activeTab === 'chargebacks') {
          return [
            transaction.id,
            transaction.original_payment_id || 'N/A',
            formatDate(transaction.created_at),
            transaction.team_name || 'N/A',
            transaction.event_name || 'N/A',
            formatCurrency(transaction.amount),
            transaction.dispute_status || 'N/A',
            transaction.dispute_reason || 'N/A'
          ];
        } else if (activeTab === 'pending-payments') {
          return [
            transaction.id,
            formatDate(transaction.created_at),
            transaction.team_name || 'N/A',
            transaction.event_name || 'N/A',
            formatCurrency(transaction.amount_due),
            transaction.status,
            transaction.manager_email || 'N/A',
            transaction.manager_phone || 'N/A'
          ];
        } else {
          // All transactions tab
          return [
            transaction.id,
            formatDate(transaction.created_at),
            transaction.team_name || 'N/A',
            transaction.event_name || 'N/A',
            transaction.payment_method || 'N/A',
            formatCurrency(transaction.amount),
            formatCurrency(transaction.stripe_fee || 0),
            formatCurrency((transaction.amount || 0) - (transaction.stripe_fee || 0)),
            transaction.status,
            transaction.settled_date ? formatDate(transaction.settled_date) : 'N/A',
            transaction.manager_email || 'N/A'
          ];
        }
      });
      
      // Convert to CSV
      const csvContent = [
        headers.join(","),
        ...rows.map((row: (string | number)[]) => row.map(cell => 
          typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
        ).join(","))
      ].join("\n");
      
      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      // Name the file based on the active tab
      const tabNames: Record<string, string> = {
        'all-transactions': 'all-transactions',
        'refunds': 'refunds',
        'chargebacks': 'chargebacks',
        'pending-payments': 'pending-payments'
      };
      
      link.setAttribute('download', `${tabNames[activeTab]}-${formatDate(new Date())}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: "Report has been exported to CSV",
        variant: "default",
      });
    } catch (err) {
      console.error("Export error:", err);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the report",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4 p-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground text-lg">Loading bookkeeping report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col space-y-4 p-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        <Alert variant="destructive" className="my-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load bookkeeping report. Please try again.'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} className="w-full max-w-xs mx-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 p-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold mb-1">Bookkeeping Report</h1>
          <p className="text-muted-foreground">
            Comprehensive financial data for accounting and bookkeeping
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[350px] sm:w-[450px]">
              <SheetHeader>
                <SheetTitle>Filter Transactions</SheetTitle>
                <SheetDescription>
                  Apply filters to narrow down results
                </SheetDescription>
              </SheetHeader>
              <div className="py-6 flex flex-col space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="date-range">Date Range</Label>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="start-date" className="w-24">Start Date:</Label>
                      <DatePicker 
                        id="start-date"
                        date={startDate} 
                        setDate={setStartDate} 
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="end-date" className="w-24">End Date:</Label>
                      <DatePicker 
                        id="end-date"
                        date={endDate} 
                        setDate={setEndDate} 
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="event">Event</Label>
                  <Select 
                    value={selectedEventId || ''} 
                    onValueChange={(value) => setSelectedEventId(value || null)}
                  >
                    <SelectTrigger id="event">
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Events</SelectItem>
                      {events.map((event: any) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Transaction Status</Label>
                  <Select 
                    value={statusFilter || ''} 
                    onValueChange={(value) => setStatusFilter(value || null)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      {uniqueStatuses.map((status: string) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select 
                    value={paymentMethodFilter || ''} 
                    onValueChange={(value) => setPaymentMethodFilter(value || null)}
                  >
                    <SelectTrigger id="payment-method">
                      <SelectValue placeholder="All Payment Methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Payment Methods</SelectItem>
                      {uniquePaymentMethods.map((method: string) => (
                        <SelectItem key={method} value={method}>
                          {method.charAt(0).toUpperCase() + method.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="settled-only" 
                    checked={showSettledOnly}
                    onCheckedChange={(checked) => {
                      setShowSettledOnly(checked === true);
                    }}
                  />
                  <Label htmlFor="settled-only">Show settled transactions only</Label>
                </div>
              </div>
              
              <SheetFooter>
                <SheetClose asChild>
                  <Button
                    onClick={() => {
                      setStatusFilter(null);
                      setPaymentMethodFilter(null);
                      setSelectedEventId(null);
                      setShowSettledOnly(false);
                      // Reset date to last 30 days
                      setStartDate(new Date(new Date().setDate(new Date().getDate() - 30)));
                      setEndDate(new Date());
                    }}
                    variant="outline"
                  >
                    Reset Filters
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button>Apply Filters</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Date Range Display */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>
          {startDate && endDate
            ? `${formatDate(startDate)} - ${formatDate(endDate)}`
            : 'All time'}
        </span>
        {showSettledOnly && (
          <Badge variant="outline" className="ml-2">Settled Only</Badge>
        )}
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm mb-1">Total Transactions</span>
              <span className="text-2xl font-bold">{summary.totalTransactions}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm mb-1">Gross Amount</span>
              <span className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm mb-1">Stripe Fees</span>
              <span className="text-2xl font-bold">{formatCurrency(summary.stripeFees)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm mb-1">Net Amount</span>
              <span className="text-2xl font-bold">{formatCurrency(summary.netAmount)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by team, manager, event..."
          className="pl-10 w-full md:max-w-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Tabs for different reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-3xl grid grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="all-transactions" className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span className="hidden md:inline">All Transactions</span>
            <span className="md:hidden">All</span>
          </TabsTrigger>
          <TabsTrigger value="refunds" className="flex items-center gap-1">
            <RotateCcw className="h-4 w-4" />
            <span>Refunds</span>
          </TabsTrigger>
          <TabsTrigger value="chargebacks" className="flex items-center gap-1">
            <CreditCard className="h-4 w-4" />
            <span>Chargebacks</span>
          </TabsTrigger>
          <TabsTrigger value="pending-payments" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden md:inline">Pending Payments</span>
            <span className="md:hidden">Pending</span>
          </TabsTrigger>
        </TabsList>
        
        {/* All Transactions Tab */}
        <TabsContent value="all-transactions">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>
                All financial transactions for the selected date range
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Gross Amount</TableHead>
                        <TableHead>Stripe Fee</TableHead>
                        <TableHead>Net Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Settlement Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction: any) => {
                        const statusBadge = getStatusBadge(transaction.status);
                        return (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">{transaction.id}</TableCell>
                            <TableCell>{formatDate(transaction.created_at)}</TableCell>
                            <TableCell>{transaction.team_name || 'N/A'}</TableCell>
                            <TableCell>{transaction.event_name || 'N/A'}</TableCell>
                            <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                            <TableCell>{formatCurrency(transaction.stripe_fee || 0)}</TableCell>
                            <TableCell>{formatCurrency((transaction.amount || 0) - (transaction.stripe_fee || 0))}</TableCell>
                            <TableCell>{transaction.payment_method || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={statusBadge.variant}>
                                {statusBadge.label}
                              </Badge>
                            </TableCell>
                            <TableCell>{transaction.settled_date ? formatDate(transaction.settled_date) : 'N/A'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No transactions found for the selected filters.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredTransactions.length} of {transactions.length} total transactions
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Refunds Tab */}
        <TabsContent value="refunds">
          <Card>
            <CardHeader>
              <CardTitle>Refund Transactions</CardTitle>
              <CardDescription>
                All refunds issued for the selected date range
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Refund ID</TableHead>
                        <TableHead>Original Payment</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Refund Amount</TableHead>
                        <TableHead>Refund Type</TableHead>
                        <TableHead>Original Amount</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction: any) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.id}</TableCell>
                          <TableCell>{transaction.original_payment_id || 'N/A'}</TableCell>
                          <TableCell>{formatDate(transaction.created_at)}</TableCell>
                          <TableCell>{transaction.team_name || 'N/A'}</TableCell>
                          <TableCell>{transaction.event_name || 'N/A'}</TableCell>
                          <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.is_partial ? 'secondary' : 'outline'}>
                              {transaction.is_partial ? 'Partial' : 'Full'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(transaction.original_amount || 0)}</TableCell>
                          <TableCell>{transaction.refund_reason || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No refunds found for the selected filters.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredTransactions.length} of {transactions.length} total refunds
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Chargebacks Tab */}
        <TabsContent value="chargebacks">
          <Card>
            <CardHeader>
              <CardTitle>Chargeback Transactions</CardTitle>
              <CardDescription>
                All chargebacks received for the selected date range
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Chargeback ID</TableHead>
                        <TableHead>Original Payment</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Dispute Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction: any) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.id}</TableCell>
                          <TableCell>{transaction.original_payment_id || 'N/A'}</TableCell>
                          <TableCell>{formatDate(transaction.created_at)}</TableCell>
                          <TableCell>{transaction.team_name || 'N/A'}</TableCell>
                          <TableCell>{transaction.event_name || 'N/A'}</TableCell>
                          <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.dispute_status === 'won' ? 'default' : 'destructive'}>
                              {transaction.dispute_status || 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.dispute_reason || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No chargebacks found for the selected filters.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredTransactions.length} of {transactions.length} total chargebacks
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Pending Payments Tab */}
        <TabsContent value="pending-payments">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payments</CardTitle>
              <CardDescription>
                All registrations with pending payments (Pay Later submissions)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team ID</TableHead>
                        <TableHead>Registration Date</TableHead>
                        <TableHead>Team Name</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Amount Due</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Contact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction: any) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.id}</TableCell>
                          <TableCell>{formatDate(transaction.created_at)}</TableCell>
                          <TableCell>{transaction.team_name || 'N/A'}</TableCell>
                          <TableCell>{transaction.event_name || 'N/A'}</TableCell>
                          <TableCell>{formatCurrency(transaction.amount_due)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.manager_name || 'N/A'}</TableCell>
                          <TableCell>
                            {transaction.manager_email && <p className="text-xs">{transaction.manager_email}</p>}
                            {transaction.manager_phone && <p className="text-xs">{transaction.manager_phone}</p>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No pending payments found for the selected filters.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredTransactions.length} of {transactions.length} total pending payments
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}