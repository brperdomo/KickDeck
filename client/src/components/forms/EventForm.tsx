import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Minus, Edit, Trash, Eye, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Editor } from '@tinymce/tinymce-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";

import {
  EventData,
  EventTab,
  TAB_ORDER,
  USA_TIMEZONES,
  eventInformationSchema,
  ageGroupSchema,
  scoringRuleSchema,
  type EventInformationValues,
  type AgeGroupValues,
  type ScoringRuleValues,
  type AgeGroup,
  type ScoringRule,
  type FieldSize,
} from "@/lib/types/event";

interface EventFormProps {
  initialData?: EventData;
  onSubmit: (data: EventData) => void;
  isEdit?: boolean;
}

// Helper function to generate unique IDs
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export function EventForm({ initialData, onSubmit, isEdit = false }: EventFormProps) {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<EventTab>('information');
  const { toast } = useToast();

  // State for managing form sections
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>(initialData?.ageGroups || []);
  const [isAgeGroupDialogOpen, setIsAgeGroupDialogOpen] = useState(false);
  const [editingAgeGroup, setEditingAgeGroup] = useState<AgeGroup | null>(null);
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>(initialData?.scoringRules || []);
  const [isScoringModalOpen, setIsScoringModalOpen] = useState(false);
  const [editingScoringRule, setEditingScoringRule] = useState<ScoringRule | null>(null);
  const [selectedComplexes, setSelectedComplexes] = useState<number[]>(initialData?.selectedComplexIds || []);
  const [eventFieldSizes, setEventFieldSizes] = useState<Record<number, FieldSize>>(
    initialData?.complexFieldSizes || {}
  );

  // Query for complexes data
  const complexesQuery = useQuery({
    queryKey: ['/api/admin/complexes'],
    enabled: activeTab === 'complexes'
  });

  // Form for event information
  const form = useForm<EventInformationValues>({
    resolver: zodResolver(eventInformationSchema),
    defaultValues: initialData || {
      name: "",
      startDate: "",
      endDate: "",
      timezone: "",
      applicationDeadline: "",
      details: "",
      agreement: "",
      refundPolicy: "",
    },
  });

  // Form for age groups
  const ageGroupForm = useForm<AgeGroupValues>({
    resolver: zodResolver(ageGroupSchema),
    defaultValues: {
      gender: 'Male',
      projectedTeams: 0,
      birthDateStart: '',
      birthDateEnd: '',
      scoringRule: '',
      ageGroup: '',
      fieldSize: '11v11',
      amountDue: null,
    }
  });

  // Form for scoring rules
  const scoringForm = useForm<ScoringRuleValues>({
    resolver: zodResolver(scoringRuleSchema),
    defaultValues: {
      title: "",
      win: 3,
      loss: 0,
      tie: 1,
      goalCapped: 5,
      shutout: 1,
      redCard: -1,
      tieBreaker: "head_to_head",
    },
  });

  // Navigation between tabs
  const navigateTab = (direction: 'next' | 'prev') => {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    if (direction === 'next' && currentIndex < TAB_ORDER.length - 1) {
      setActiveTab(TAB_ORDER[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setActiveTab(TAB_ORDER[currentIndex - 1]);
    }
  };

  // Age group handlers
  const handleAddAgeGroup = (data: AgeGroupValues) => {
    if (editingAgeGroup) {
      setAgeGroups(ageGroups.map(group =>
        group.id === editingAgeGroup.id ? { ...data, id: group.id } : group
      ));
      setEditingAgeGroup(null);
    } else {
      setAgeGroups([...ageGroups, { ...data, id: generateId() }]);
    }
    setIsAgeGroupDialogOpen(false);
    ageGroupForm.reset();
  };

  const handleEditAgeGroup = (ageGroup: AgeGroup) => {
    setEditingAgeGroup(ageGroup);
    ageGroupForm.reset(ageGroup);
    setIsAgeGroupDialogOpen(true);
  };

  const handleDeleteAgeGroup = (id: string) => {
    setAgeGroups(ageGroups.filter(group => group.id !== id));
  };

  // Scoring rule handlers
  const handleScoringRuleSubmit = (data: ScoringRuleValues) => {
    if (editingScoringRule) {
      setScoringRules(rules => rules.map(rule =>
        rule.id === editingScoringRule.id ? { ...data, id: rule.id } : rule
      ));
      setEditingScoringRule(null);
    } else {
      setScoringRules([...scoringRules, { ...data, id: generateId() }]);
    }
    setIsScoringModalOpen(false);
    scoringForm.reset();
  };

  const handleEditScoringRule = (rule: ScoringRule) => {
    setEditingScoringRule(rule);
    scoringForm.reset(rule);
    setIsScoringModalOpen(true);
  };

  const handleDeleteScoringRule = (id: string) => {
    setScoringRules(scoringRules.filter(rule => rule.id !== id));
  };

  // Handle form submission
  const handleSubmit = (data: EventInformationValues) => {
    const completeEventData: EventData = {
      ...data,
      ageGroups,
      scoringRules,
      complexFieldSizes: eventFieldSizes,
      selectedComplexIds: selectedComplexes,
    };
    onSubmit(completeEventData);
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
        <h2 className="text-2xl font-bold">{isEdit ? 'Edit Event' : 'Create Event'}</h2>
      </div>

      <Card className="mx-auto">
        <CardContent className="p-6">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as EventTab)}
            className="space-y-6"
          >
            <TabsList className="grid grid-cols-6 gap-4">
              <TabsTrigger value="information">Event Information</TabsTrigger>
              <TabsTrigger value="age-groups">Age Groups</TabsTrigger>
              <TabsTrigger value="scoring">Scoring Settings</TabsTrigger>
              <TabsTrigger value="complexes">Complexes & Fields</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="administrators">Administrators</TabsTrigger>
            </TabsList>

            <TabsContent value="information">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 max-w-4xl mx-auto">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter event name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Start Date *</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
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
                          <FormLabel>Event End Date *</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Zone *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time zone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {USA_TIMEZONES.map((timezone) => (
                              <SelectItem key={timezone.value} value={timezone.value}>
                                {timezone.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="applicationDeadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application Deadline *</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Details</FormLabel>
                        <FormControl>
                          <Editor
                            apiKey="wysafiugpee0xtyjdnegcq6x43osb81qje582522ekththu8"
                            init={{
                              height: 300,
                              menubar: true,
                              plugins: [
                                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                'insertdatetime', 'media', 'table', 'help', 'wordcount'
                              ],
                              toolbar: 'undo redo | formatselect | ' +
                                'bold italic backcolor | alignleft aligncenter ' +
                                'alignright alignjustify | bullist numlist outdent indent | ' +
                                'removeformat | help',
                            }}
                            value={field.value}
                            onEditorChange={(content) => field.onChange(content)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit">Save & Continue</Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="age-groups">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <Button variant="outline" onClick={() => navigateTab('prev')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Dialog open={isAgeGroupDialogOpen} onOpenChange={setIsAgeGroupDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingAgeGroup(null);
                        ageGroupForm.reset();
                      }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Age Group
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingAgeGroup ? 'Edit Age Group' : 'Add Age Group'}
                        </DialogTitle>
                      </DialogHeader>
                      <Form {...ageGroupForm}>
                        <form onSubmit={ageGroupForm.handleSubmit(handleAddAgeGroup)} className="space-y-4">
                          {/* Age group form fields */}
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={ageGroupForm.control}
                              name="gender"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Gender *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Male">Male</SelectItem>
                                      <SelectItem value="Female">Female</SelectItem>
                                      <SelectItem value="Coed">Coed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            {/* Add other age group fields */}
                          </div>
                          <div className="flex justify-end">
                            <Button type="submit">
                              {editingAgeGroup ? 'Update' : 'Add'} Age Group
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Age Group</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Birth Date Range</TableHead>
                      <TableHead>Field Size</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ageGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>{group.ageGroup}</TableCell>
                        <TableCell>{group.gender}</TableCell>
                        <TableCell>
                          {new Date(group.birthDateStart).toLocaleDateString()} - 
                          {new Date(group.birthDateEnd).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{group.fieldSize}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditAgeGroup(group)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAgeGroup(group.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Add other tab contents */}
            <TabsContent value="scoring">
              {/* Scoring settings content */}
            </TabsContent>

            <TabsContent value="complexes">
              {/* Complexes content */}
            </TabsContent>

            <TabsContent value="settings">
              {/* Settings content */}
            </TabsContent>

            <TabsContent value="administrators">
              {/* Administrators content */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}