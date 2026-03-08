import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface Fee {
  id: number;
  name: string;
  amount: number;
  feeType: string;
  isRequired: boolean;
}

interface DetailedFeeBreakdownProps {
  teamId: number;
  selectedFeeIds?: string | null;
  totalAmount?: number;
  appliedCoupon?: string | null;
}

export function DetailedFeeBreakdown({ teamId, selectedFeeIds, totalAmount, appliedCoupon }: DetailedFeeBreakdownProps) {
  const feesQuery = useQuery({
    queryKey: ['/api/admin/teams', teamId, 'fees', selectedFeeIds],
    queryFn: async () => {
      if (!teamId || !selectedFeeIds) return [];
      const response = await fetch(`/api/admin/teams/${teamId}/fees?selectedFeeIds=${selectedFeeIds}`);
      if (!response.ok) throw new Error('Failed to fetch fee details');
      return response.json() as Promise<Fee[]>;
    },
    enabled: !!teamId && !!selectedFeeIds && selectedFeeIds !== ''
  });

  const groupedFees = useMemo(() => {
    if (!feesQuery.data || feesQuery.data.length === 0) return {};
    const groups: Record<string, Fee[]> = {};
    feesQuery.data.forEach((fee) => {
      const type = fee.feeType || 'Other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(fee);
    });
    return groups;
  }, [feesQuery.data]);

  const feesSubtotal = useMemo(() => {
    if (!feesQuery.data || feesQuery.data.length === 0) return 0;
    return feesQuery.data.reduce((sum, fee) => sum + fee.amount, 0);
  }, [feesQuery.data]);

  const discountInfo = useMemo(() => {
    if (!totalAmount || !feesSubtotal || totalAmount >= feesSubtotal) return null;
    const discountAmount = feesSubtotal - totalAmount;
    const discountPercentage = Math.round((discountAmount / feesSubtotal) * 100);
    return {
      amount: discountAmount,
      percentage: discountPercentage,
      code: appliedCoupon || 'Discount Applied'
    };
  }, [feesSubtotal, totalAmount, appliedCoupon]);

  const formatFeeType = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'registration': return 'Registration Fees';
      case 'uniform': return 'Uniform Fees';
      case 'equipment': return 'Equipment Fees';
      case 'tournament': return 'Tournament Fees';
      default: return 'Other Fees';
    }
  };

  if (feesQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 py-3">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading fees...</span>
      </div>
    );
  }

  if (feesQuery.isError) {
    return (
      <p className="text-sm text-destructive py-2">
        Error loading fee details
      </p>
    );
  }

  if (!feesQuery.data || feesQuery.data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No fee details available
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {Object.entries(groupedFees).map(([feeType, fees]) => (
        <div key={feeType}>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">{formatFeeType(feeType)}</h4>
          <div className="space-y-1">
            {fees.map((fee) => (
              <div key={fee.id} className="flex items-center justify-between py-1.5 px-2 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{fee.name}</span>
                  {fee.isRequired ? (
                    <Badge variant="outline" className="text-xs px-1.5 py-0 border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                      Required
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      Optional
                    </Badge>
                  )}
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {formatCurrency(fee.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="border-t border-border pt-3 space-y-1.5">
        {discountInfo ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatCurrency(feesSubtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
              <span>{discountInfo.code} ({discountInfo.percentage}% off)</span>
              <span className="tabular-nums">-{formatCurrency(discountInfo.amount)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-1.5 border-t border-border">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(totalAmount)}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(feesSubtotal)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
