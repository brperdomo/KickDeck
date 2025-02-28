import { useState } from "react";
import { useParams } from "wouter";
import { ArrowLeft, Edit, Trash2, ArrowUpDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const feeFormSchema = z.object({
  name: z.string().min(1, "Fee name is required"),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number"
  ),
  beginDate: z.string().optional(),
  endDate: z.string().optional(),
  accountingCodeId: z.number().nullable().optional(),
});

type FeeFormValues = z.infer<typeof feeFormSchema>;
type SortField = 'name' | 'amount' | 'beginDate';
type SortDirection = 'asc' | 'desc';

export function FeeManagement() {
  const params = useParams();
  const eventId = params.id;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FeeFormValues>({
    resolver: zodResolver(feeFormSchema),
    defaultValues: {
      name: "",
      amount: "",
      beginDate: "",
      endDate: "",
      accountingCodeId: null,
    }
  });

  const feesQuery = useQuery({
    queryKey: ['fees', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/fees`);
      if (!response.ok) throw new Error('Failed to fetch fees');
      return response.json();
    },
  });

  const accountingCodesQuery = useQuery({
    queryKey: ['accountingCodes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/accounting-codes');
      if (!response.ok) throw new Error('Failed to fetch accounting codes');
      return response.json();
    },
  });

  const createFeeMutation = useMutation({
    mutationFn: async (values: FeeFormValues) => {
      const response = await fetch(`/api/admin/events/${eventId}/fees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          amount: Math.round(Number(values.amount) * 100),
        }),
      });
      if (!response.ok) throw new Error('Failed to create fee');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', eventId] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Fee created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateFeeMutation = useMutation({
    mutationFn: async (values: FeeFormValues & { id: number }) => {
      const response = await fetch(`/api/admin/events/${eventId}/fees/${values.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          amount: Math.round(Number(values.amount) * 100),
        }),
      });
      if (!response.ok) throw new Error('Failed to update fee');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', eventId] });
      setIsDialogOpen(false);
      setEditingFee(null);
      form.reset();
      toast({
        title: "Success",
        description: "Fee updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteFeeMutation = useMutation({
    mutationFn: async (feeId: number) => {
      const response = await fetch(`/api/admin/events/${eventId}/fees/${feeId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error('Failed to delete fee');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', eventId] });
      toast({
        title: "Success",
        description: "Fee deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: FeeFormValues) => {
    if (editingFee) {
      updateFeeMutation.mutate({ ...values, id: editingFee.id });
    } else {
      createFeeMutation.mutate(values);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedFees = feesQuery.data ? [...feesQuery.data].sort((a, b) => {
    const modifier = sortDirection === 'asc' ? 1 : -1;
    if (sortField === 'amount') {
      return (a.amount - b.amount) * modifier;
    }
    if (sortField === 'beginDate') {
      return (new Date(a.beginDate || 0).getTime() - new Date(b.beginDate || 0).getTime()) * modifier;
    }
    return a[sortField].localeCompare(b[sortField]) * modifier;
  }) : [];

  if (feesQuery.isLoading || accountingCodesQuery.isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (feesQuery.error || accountingCodesQuery.error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] space-y-4">
        <div className="text-red-500 font-semibold">Failed to load fee management data</div>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Events
        </Button>
      </div>
    );
  }

  const formatCurrency = (amount: number) => `$${(amount / 100).toFixed(2)}`;

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Fee Management</h1>
        </div>
        <Button onClick={() => {
          setEditingFee(null);
          form.reset();
          setIsDialogOpen(true);
        }}>
          Add New Fee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fee List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                  Fee Name <ArrowUpDown className="inline h-4 w-4" />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>
                  Amount <ArrowUpDown className="inline h-4 w-4" />
                </TableHead>
                <TableHead>Accounting Code</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('beginDate')}>
                  Begin Date <ArrowUpDown className="inline h-4 w-4" />
                </TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFees.map((fee: any) => (
                <TableRow key={fee.id}>
                  <TableCell>{fee.name}</TableCell>
                  <TableCell>{formatCurrency(fee.amount)}</TableCell>
                  <TableCell>{accountingCodesQuery.data?.find(code => code.id === fee.accountingCodeId)?.name || '-'}</TableCell>
                  <TableCell>
                    {fee.beginDate ? format(new Date(fee.beginDate), "MMM d, yyyy") : "-"}
                  </TableCell>
                  <TableCell>
                    {fee.endDate ? format(new Date(fee.endDate), "MMM d, yyyy") : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          form.reset({
                            name: fee.name,
                            amount: (fee.amount / 100).toString(),
                            beginDate: fee.beginDate || "",
                            endDate: fee.endDate || "",
                            accountingCodeId: fee.accountingCodeId || null,
                          });
                          setEditingFee(fee);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this fee?')) {
                            deleteFeeMutation.mutate(fee.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFee ? "Edit Fee" : "Add New Fee"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter fee name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="beginDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Begin Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="accountingCodeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accounting Code</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select accounting code" />
                      </SelectTrigger>
                      <SelectContent>
                        {accountingCodesQuery.data?.map((code: any) => (
                          <SelectItem key={code.id} value={code.id.toString()}>
                            {code.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingFee(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingFee ? "Update Fee" : "Create Fee"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useToast } from '../ui/use-toast';
import { format } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DatePicker } from '../ui/date-picker';

export function FeeManagement() {
  const { id: eventId } = useParams();
  const [isAddFeeOpen, setIsAddFeeOpen] = useState(false);
  const [isEditFeeOpen, setIsEditFeeOpen] = useState(false);
  const [isAssignFeeOpen, setIsAssignFeeOpen] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [selectedFeeId, setSelectedFeeId] = useState(null);
  const [newFee, setNewFee] = useState({
    name: '',
    amount: '',
    beginDate: null,
    endDate: null,
    applyToAll: false,
  });
  const [selectedAgeGroups, setSelectedAgeGroups] = useState({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch event fees
  const { data: fees, isLoading: isLoadingFees } = useQuery({
    queryKey: ['eventFees', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/fees`);
      if (!response.ok) {
        throw new Error('Failed to fetch fees');
      }
      return response.json();
    },
    enabled: !!eventId,
  });

  // Fetch event age groups
  const { data: ageGroups, isLoading: isLoadingAgeGroups } = useQuery({
    queryKey: ['eventAgeGroups', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/age-groups`);
      if (!response.ok) {
        throw new Error('Failed to fetch age groups');
      }
      return response.json();
    },
    enabled: !!eventId,
  });

  // Fetch fee assignments
  const { data: feeAssignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['feeAssignments', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/fee-assignments`);
      if (!response.ok) {
        throw new Error('Failed to fetch fee assignments');
      }
      return response.json();
    },
    enabled: !!eventId,
  });

  // Initialize selected age groups when fee assignments load
  useEffect(() => {
    if (feeAssignments && ageGroups) {
      const assignmentMap = {};
      ageGroups.forEach(group => {
        assignmentMap[group.id] = {};
        fees?.forEach(fee => {
          const isAssigned = feeAssignments.some(
            assignment => assignment.ageGroupId === group.id && assignment.feeId === fee.id
          );
          assignmentMap[group.id][fee.id] = isAssigned;
        });
      });
      setSelectedAgeGroups(assignmentMap);
    }
  }, [feeAssignments, ageGroups, fees]);

  // Add fee mutation
  const addFeeMutation = useMutation({
    mutationFn: async (fee) => {
      const response = await fetch(`/api/admin/events/${eventId}/fees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fee),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add fee');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['eventFees', eventId]);
      setIsAddFeeOpen(false);
      setNewFee({
        name: '',
        amount: '',
        beginDate: null,
        endDate: null,
        applyToAll: false,
      });
      toast({
        title: 'Success',
        description: 'Fee added successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add fee',
        variant: 'destructive',
      });
    },
  });

  // Update fee mutation
  const updateFeeMutation = useMutation({
    mutationFn: async (fee) => {
      const response = await fetch(`/api/admin/events/${eventId}/fees/${fee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fee),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update fee');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['eventFees', eventId]);
      setIsEditFeeOpen(false);
      setEditingFee(null);
      toast({
        title: 'Success',
        description: 'Fee updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update fee',
        variant: 'destructive',
      });
    },
  });

  // Delete fee mutation
  const deleteFeeMutation = useMutation({
    mutationFn: async (feeId) => {
      const response = await fetch(`/api/admin/events/${eventId}/fees/${feeId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete fee');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['eventFees', eventId]);
      queryClient.invalidateQueries(['feeAssignments', eventId]);
      toast({
        title: 'Success',
        description: 'Fee deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete fee',
        variant: 'destructive',
      });
    },
  });

  // Update fee assignments mutation
  const updateAssignmentsMutation = useMutation({
    mutationFn: async ({ feeId, ageGroupIds }) => {
      const response = await fetch(`/api/admin/events/${eventId}/fee-assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feeId,
          ageGroupIds,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update fee assignments');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['feeAssignments', eventId]);
      setIsAssignFeeOpen(false);
      setSelectedFeeId(null);
      toast({
        title: 'Success',
        description: 'Fee assignments updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update fee assignments',
        variant: 'destructive',
      });
    },
  });

  const handleAddFee = () => {
    const feeData = {
      ...newFee,
      amount: parseFloat(newFee.amount) * 100, // Convert to cents
    };
    
    addFeeMutation.mutate(feeData);
  };

  const handleUpdateFee = () => {
    const feeData = {
      ...editingFee,
      amount: parseFloat(editingFee.amount) * 100, // Convert to cents
    };
    
    updateFeeMutation.mutate(feeData);
  };

  const handleDeleteFee = (feeId) => {
    if (window.confirm('Are you sure you want to delete this fee?')) {
      deleteFeeMutation.mutate(feeId);
    }
  };

  const handleSaveAssignments = () => {
    const selectedAgeGroupIds = [];
    
    Object.entries(selectedAgeGroups).forEach(([ageGroupId, feeMap]) => {
      Object.entries(feeMap).forEach(([feeId, isSelected]) => {
        if (parseInt(feeId) === selectedFeeId && isSelected) {
          selectedAgeGroupIds.push(parseInt(ageGroupId));
        }
      });
    });
    
    updateAssignmentsMutation.mutate({
      feeId: selectedFeeId,
      ageGroupIds: selectedAgeGroupIds,
    });
  };

  const openAssignFeeDialog = (feeId) => {
    setSelectedFeeId(feeId);
    setIsAssignFeeOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Fees Management</CardTitle>
          <CardDescription>Manage fees for this event and assign them to age groups</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fees">
            <TabsList>
              <TabsTrigger value="fees">Fee List</TabsTrigger>
              <TabsTrigger value="assignments">Fee Assignments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="fees" className="space-y-4">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setIsAddFeeOpen(true)}>Add Fee</Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Apply to All</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingFees ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">Loading fees...</TableCell>
                    </TableRow>
                  ) : fees?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">No fees found</TableCell>
                    </TableRow>
                  ) : (
                    fees?.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell>{fee.name}</TableCell>
                        <TableCell>${(fee.amount / 100).toFixed(2)}</TableCell>
                        <TableCell>
                          {fee.beginDate ? format(new Date(fee.beginDate), 'MM/dd/yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {fee.endDate ? format(new Date(fee.endDate), 'MM/dd/yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>{fee.applyToAll ? 'Yes' : 'No'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingFee({
                                  ...fee,
                                  amount: (fee.amount / 100).toString(),
                                  beginDate: fee.beginDate ? new Date(fee.beginDate) : null,
                                  endDate: fee.endDate ? new Date(fee.endDate) : null,
                                });
                                setIsEditFeeOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAssignFeeDialog(fee.id)}
                            >
                              Assign
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteFee(fee.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="assignments" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Age Group</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Birth Year</TableHead>
                    <TableHead>Division Code</TableHead>
                    <TableHead>Assigned Fees</TableHead>
                    <TableHead>Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingAgeGroups || isLoadingFees || isLoadingAssignments ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">Loading data...</TableCell>
                    </TableRow>
                  ) : ageGroups?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">No age groups found</TableCell>
                    </TableRow>
                  ) : (
                    ageGroups?.map((ageGroup) => {
                      // Find assigned fees for this age group
                      const assignedFees = feeAssignments
                        ? fees?.filter(fee =>
                            feeAssignments.some(
                              assignment =>
                                assignment.ageGroupId === ageGroup.id && assignment.feeId === fee.id
                            )
                          )
                        : [];
                      
                      // Calculate total amount
                      const totalAmount = assignedFees.reduce(
                        (sum, fee) => sum + fee.amount,
                        0
                      );
                      
                      return (
                        <TableRow key={ageGroup.id}>
                          <TableCell>{ageGroup.ageGroup}</TableCell>
                          <TableCell>{ageGroup.gender}</TableCell>
                          <TableCell>{ageGroup.birthYear}</TableCell>
                          <TableCell>{ageGroup.divisionCode}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {assignedFees.map(fee => (
                                <div key={fee.id}>
                                  {fee.name} - ${(fee.amount / 100).toFixed(2)}
                                </div>
                              ))}
                              {assignedFees.length === 0 && (
                                <div className="text-muted-foreground">No fees assigned</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>${(totalAmount / 100).toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Fee Dialog */}
      <Dialog open={isAddFeeOpen} onOpenChange={setIsAddFeeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Fee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fee-name">Fee Name</Label>
              <Input
                id="fee-name"
                value={newFee.name}
                onChange={(e) => setNewFee({ ...newFee, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee-amount">Amount ($)</Label>
              <Input
                id="fee-amount"
                type="number"
                step="0.01"
                value={newFee.amount}
                onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee-begin-date">Begin Date</Label>
              <DatePicker
                id="fee-begin-date"
                selected={newFee.beginDate}
                onSelect={(date) => setNewFee({ ...newFee, beginDate: date })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee-end-date">End Date</Label>
              <DatePicker
                id="fee-end-date"
                selected={newFee.endDate}
                onSelect={(date) => setNewFee({ ...newFee, endDate: date })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fee-apply-all"
                checked={newFee.applyToAll}
                onCheckedChange={(checked) =>
                  setNewFee({ ...newFee, applyToAll: !!checked })
                }
              />
              <Label htmlFor="fee-apply-all">Apply to All Age Groups</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFeeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFee}>Add Fee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Fee Dialog */}
      <Dialog open={isEditFeeOpen} onOpenChange={setIsEditFeeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Fee</DialogTitle>
          </DialogHeader>
          {editingFee && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fee-name">Fee Name</Label>
                <Input
                  id="edit-fee-name"
                  value={editingFee.name}
                  onChange={(e) =>
                    setEditingFee({ ...editingFee, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fee-amount">Amount ($)</Label>
                <Input
                  id="edit-fee-amount"
                  type="number"
                  step="0.01"
                  value={editingFee.amount}
                  onChange={(e) =>
                    setEditingFee({ ...editingFee, amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fee-begin-date">Begin Date</Label>
                <DatePicker
                  id="edit-fee-begin-date"
                  selected={editingFee.beginDate}
                  onSelect={(date) =>
                    setEditingFee({ ...editingFee, beginDate: date })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fee-end-date">End Date</Label>
                <DatePicker
                  id="edit-fee-end-date"
                  selected={editingFee.endDate}
                  onSelect={(date) =>
                    setEditingFee({ ...editingFee, endDate: date })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-fee-apply-all"
                  checked={editingFee.applyToAll}
                  onCheckedChange={(checked) =>
                    setEditingFee({
                      ...editingFee,
                      applyToAll: !!checked,
                    })
                  }
                />
                <Label htmlFor="edit-fee-apply-all">Apply to All Age Groups</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditFeeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFee}>Update Fee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Fees Dialog */}
      <Dialog open={isAssignFeeOpen} onOpenChange={setIsAssignFeeOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Assign Fee: {selectedFeeId && fees?.find(f => f.id === selectedFeeId)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assign</TableHead>
                  <TableHead>Age Group</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Birth Year</TableHead>
                  <TableHead>Division Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingAgeGroups ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading age groups...</TableCell>
                  </TableRow>
                ) : ageGroups?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No age groups found</TableCell>
                  </TableRow>
                ) : (
                  ageGroups?.map((ageGroup) => (
                    <TableRow key={ageGroup.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedAgeGroups[ageGroup.id]?.[selectedFeeId] || false}
                          onCheckedChange={(checked) => {
                            setSelectedAgeGroups(prev => ({
                              ...prev,
                              [ageGroup.id]: {
                                ...(prev[ageGroup.id] || {}),
                                [selectedFeeId]: !!checked,
                              },
                            }));
                          }}
                        />
                      </TableCell>
                      <TableCell>{ageGroup.ageGroup}</TableCell>
                      <TableCell>{ageGroup.gender}</TableCell>
                      <TableCell>{ageGroup.birthYear}</TableCell>
                      <TableCell>{ageGroup.divisionCode}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignFeeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAssignments}>Save Assignments</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
