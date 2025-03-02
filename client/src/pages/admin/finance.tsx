import { useState } from "react";
import { useNavigate } from "@/hooks/use-navigate";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, FileText, Loader2, Edit, Trash } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function FinancePage() {
  const navigate = useNavigate();
  const [selectedFinancialReport, setSelectedFinancialReport] = useState<string>('accounting-codes');
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isAccountingCodeModalOpen, setIsAccountingCodeModalOpen] = useState(false);
  const [selectedAccountingCode, setSelectedAccountingCode] = useState<{
    id: number;
    code: string;
    name: string;
    description?: string;
  } | null>(null);
  const queryClient = useQueryClient();

  const accountingCodesQuery = useQuery({
    queryKey: ['/api/admin/accounting-codes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/accounting-codes');
      if (!response.ok) throw new Error('Failed to fetch accounting codes');
      return response.json();
    }
  });

  const startExport = (reportType: string) => {
    setIsExporting(reportType);
    // Simulate export process
    setTimeout(() => {
      setIsExporting(null);
    }, 2000);
  };

  const handleEditCode = (code: any) => {
    setSelectedAccountingCode(code);
    setIsAccountingCodeModalOpen(true);
  };

  const handleDeleteCode = async (codeId: number) => {
    if (confirm("Are you sure you want to delete this code?")) {
      try {
        const response = await fetch(`/api/admin/accounting-codes/${codeId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) throw new Error('Failed to delete code');
        
        // Refetch data after deletion
        queryClient.invalidateQueries({queryKey: ['/api/admin/accounting-codes']});
      } catch (error) {
        console.error("Error deleting code:", error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">Financial Management</h2>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <select 
              className="border rounded px-2 py-1"
              value={selectedFinancialReport}
              onChange={(e) => setSelectedFinancialReport(e.target.value)}
            >
              <option value="accounting-codes">Accounting Codes</option>
              <option value="fees-by-event">Fees by Event</option>
              <option value="fees-by-age-group">Fees by Age Group</option>
            </select>
          </div>
          <div className="flex gap-2">
            {selectedFinancialReport === 'accounting-codes' && (
              <Button onClick={() => setIsAccountingCodeModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Accounting Code
              </Button>
            )}
            <Button
              onClick={() => startExport('financial')}
              disabled={isExporting !== null}
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Export Report
                </>
              )}
            </Button>
          </div>
        </div>

        {selectedFinancialReport === 'accounting-codes' && (
          <Card>
            <CardContent className="p-6">
              {accountingCodesQuery.isLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : accountingCodesQuery.isError ? (
                <div className="text-red-500 p-4">
                  Error loading accounting codes
                </div>
              ) : accountingCodesQuery.data?.length === 0 ? (
                <div className="text-center p-4">
                  No accounting codes found. Click "Add Accounting Code" to create one.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountingCodesQuery.data?.map((code: any) => (
                      <TableRow key={code.id}>
                        <TableCell>{code.code}</TableCell>
                        <TableCell>{code.name}</TableCell>
                        <TableCell>{code.description || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCode(code)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCode(code.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {selectedFinancialReport === 'fees-by-event' && (
          <Card>
            <CardHeader>
              <CardTitle>Fees by Event</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                Event fees report coming soon
              </div>
            </CardContent>
          </Card>
        )}

        {selectedFinancialReport === 'fees-by-age-group' && (
          <Card>
            <CardHeader>
              <CardTitle>Fees by Age Group</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                Age group fees report coming soon
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}