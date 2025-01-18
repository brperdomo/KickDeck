import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Minus, Edit, Trash, Eye, ArrowRight, Loader2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";

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

  // Initialize state with either initial data or empty values
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
  const [viewingComplexId, setViewingComplexId] = useState<number | null>(null);

  // Query for complexes data
  const complexesQuery = useQuery({
    queryKey: ['/api/admin/complexes'],
    enabled: activeTab === 'complexes'
  });

  // Query for complex fields
  const fieldsQuery = useQuery({
    queryKey: [`/api/admin/complexes/${viewingComplexId}/fields`, viewingComplexId],
    enabled: !!viewingComplexId,
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
      setAgeGroups(groups => groups.map(group =>
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
  const handleSubmit = async (data: EventInformationValues) => {
    const completeEventData: EventData = {
      ...data,
      ageGroups,
      scoringRules,
      complexFieldSizes: eventFieldSizes,
      selectedComplexIds: selectedComplexes,
    };

    try {
      await onSubmit(completeEventData);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save event",
        variant: "destructive",
      });
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

            {/* Event Information Tab */}
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                    <Button type="button" onClick={() => navigateTab('next')}>
                      Continue
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            {/* Age Groups Tab */}
            <TabsContent value="age-groups">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => navigateTab('prev')}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <h3 className="text-lg font-semibold">Age Groups</h3>
                  </div>
                  <Dialog open={isAgeGroupDialogOpen} onOpenChange={setIsAgeGroupDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingAgeGroup(null);
                        ageGroupForm.reset();
                      }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Age Group
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingAgeGroup ? 'Edit Age Group' : 'Add New Age Group'}
                        </DialogTitle>
                      </DialogHeader>
                      <Form {...ageGroupForm}>
                        <form onSubmit={ageGroupForm.handleSubmit(handleAddAgeGroup)} className="space-y-4">
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
                            <FormField
                              control={ageGroupForm.control}
                              name="projectedTeams"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Projected # of Teams</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="200"
                                      {...field}
                                      onChange={e => field.onChange(Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={ageGroupForm.control}
                              name="birthDateStart"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Birth Date Range (Start) *</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={ageGroupForm.control}
                              name="birthDateEnd"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Birth Date Range (End) *</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={ageGroupForm.control}
                              name="ageGroup"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Age Group *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select age group" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {Array.from({ length: 22 }, (_, i) => i + 4).map((age) => (
                                        <SelectItem key={age} value={`U${age}`}>
                                          U{age}
                                        </SelectItem>
                                      ))}
                                      <SelectItem value="Open">Open</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={ageGroupForm.control}
                              name="fieldSize"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Field Size</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select field size" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {['3v3', '4v4', '5v5', '6v6', '7v7', '8v8', '9v9', '10v10', '11v11', 'N/A'].map((size) => (
                                        <SelectItem key={size} value={size}>
                                          {size}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={ageGroupForm.control}
                            name="amountDue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Registration Fee</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    {...field}
                                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

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
                      <TableHead>Registration Fee</TableHead>
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
                          {group.amountDue ? `$${group.amountDue.toFixed(2)}` : 'N/A'}
                        </TableCell>
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

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => navigateTab('prev')}>Back</Button>
                  <Button onClick={() => navigateTab('next')}>Continue</Button>
                </div>
              </div>
            </TabsContent>

            {/* Scoring Settings Tab */}
            <TabsContent value="scoring">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => navigateTab('prev')}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <h3 className="text-lg font-semibold">Scoring Rules</h3>
                  </div>
                  <Dialog open={isScoringModalOpen} onOpenChange={setIsScoringModalOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingScoringRule(null);
                        scoringForm.reset();
                      }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Scoring Rule
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingScoringRule ? 'Edit Scoring Rule' : 'Add Scoring Rule'}
                        </DialogTitle>
                      </DialogHeader>
                      <Form {...scoringForm}>
                        <form onSubmit={scoringForm.handleSubmit(handleScoringRuleSubmit)} className="space-y-4">
                          <FormField
                            control={scoringForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Rule Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Enter rule name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={scoringForm.control}
                              name="win"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Win Points</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={e => field.onChange(Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={scoringForm.control}
                              name="loss"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Loss Points</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={e => field.onChange(Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={scoringForm.control}
                              name="tie"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tie Points</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={e => field.onChange(Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={scoringForm.control}
                              name="goalCapped"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Goal Cap</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={e => field.onChange(Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={scoringForm.control}
                              name="shutout"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Shutout Points</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={e => field.onChange(Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={scoringForm.control}
                              name="redCard"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Red Card Points</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={e => field.onChange(Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={scoringForm.control}
                            name="tieBreaker"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tie Breaker *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select tie breaker" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="head_to_head">Head to Head</SelectItem>
                                    <SelectItem value="goal_difference">Goal Difference</SelectItem>
                                    <SelectItem value="goals_scored">Goals Scored</SelectItem>
                                    <SelectItem value="fair_play">Fair Play Points</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end">
                            <Button type="submit">
                              {editingScoringRule ? 'Update' : 'Add'} Scoring Rule
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
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Points (W/L/T)</TableHead>
                      <TableHead>Goal Cap</TableHead>
                      <TableHead>Shutout</TableHead>
                      <TableHead>Red Card</TableHead>
                      <TableHead>Tie Breaker</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scoringRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>{rule.title}</TableCell>
                        <TableCell>{rule.win}/{rule.loss}/{rule.tie}</TableCell>
                        <TableCell>{rule.goalCapped}</TableCell>
                        <TableCell>{rule.shutout}</TableCell>
                        <TableCell>{rule.redCard}</TableCell>
                        <TableCell>{rule.tieBreaker.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditScoringRule(rule)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteScoringRule(rule.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => navigateTab('prev')}>Back</Button>
                  <Button onClick={() => navigateTab('next')}>Continue</Button>
                </div>
              </div>
            </TabsContent>

            {/* Complexes & Fields Tab */}
            <TabsContent value="complexes">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => navigateTab('prev')}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <h3 className="text-lg font-semibold">Complexes & Fields</h3>
                  </div>
                </div>

                {complexesQuery.isLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : complexesQuery.error ? (
                  <div className="text-center text-red-500">
                    Error loading complexes
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Complex Name</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Fields</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {complexesQuery.data?.map((complex) => {
                          const isSelected = selectedComplexes.includes(complex.id);
                          const fieldSize = eventFieldSizes[complex.id];

                          return (
                            <TableRow key={complex.id}>
                              <TableCell>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedComplexes([...selectedComplexes, complex.id]);
                                    } else {
                                      setSelectedComplexes(selectedComplexes.filter(id => id !== complex.id));
                                      const newFieldSizes = { ...eventFieldSizes };
                                      delete newFieldSizes[complex.id];
                                      setEventFieldSizes(newFieldSizes);
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell>{complex.name}</TableCell>
                              <TableCell>
                                {complex.address}, {complex.city}, {complex.state}
                              </TableCell>
                              <TableCell>
                                {complex.openFields + complex.closedFields} fields
                                {fieldSize && <Badge className="ml-2">{fieldSize}</Badge>}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setViewingComplexId(complex.id)}
                                    disabled={!isSelected}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {isSelected && (
                                    <Select
                                      value={fieldSize}
                                      onValueChange={(value: FieldSize) => {
                                        setEventFieldSizes({
                                          ...eventFieldSizes,
                                          [complex.id]: value
                                        });
                                      }}
                                    >
                                      <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select field size" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {['3v3', '4v4', '5v5', '6v6', '7v7', '8v8', '9v9', '10v10', '11v11'].map((size) => (
                                          <SelectItem key={size} value={size}>
                                            {size}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {viewingComplexId && (
                      <Dialog open={!!viewingComplexId} onOpenChange={() => setViewingComplexId(null)}>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Complex Fields</DialogTitle>
                          </DialogHeader>
                          {fieldsQuery.isLoading ? (
                            <div className="flex justify-center p-8">
                              <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                          ) : fieldsQuery.error ? (
                            <div className="text-center text-red-500">
                              Error loading fields
                            </div>
                          ) : (
                            <Table>
                                                            <TableHeader>
                                <TableRow>
                                  <TableHead>Field Name</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Features</TableHead>
                                  <TableHead>Special Instructions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {fieldsQuery.data?.map((field) => (
                                  <TableRow key={field.id}>
                                    <TableCell>{field.name}</TableCell>
                                    <TableCell>
                                      <Badge variant={field.isOpen ? "default" : "secondary"}>
                                        {field.isOpen ? 'Open' : 'Closed'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-2">
                                        {field.hasLights && (
                                          <Badge variant="outline">Lights</Badge>
                                        )}
                                        {field.hasParking && (
                                          <Badge variant="outline">Parking</Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>{field.specialInstructions || 'None'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </DialogContent>
                      </Dialog>
                    )}
                  </>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => navigateTab('prev')}>Back</Button>
                  <Button onClick={() => navigateTab('next')}>Continue</Button>
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => navigateTab('prev')}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <h3 className="text-lg font-semibold">Additional Settings</h3>
                  </div>
                </div>

                <Form {...form}>
                  <form className="space-y-8 max-w-4xl mx-auto">
                    <FormField
                      control={form.control}
                      name="agreement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agreement</FormLabel>
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

                    <FormField
                      control={form.control}
                      name="refundPolicy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Refund Policy</FormLabel>
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

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => navigateTab('prev')}>Back</Button>
                      <Button onClick={() => navigateTab('next')}>Continue</Button>
                    </div>
                  </form>
                </Form>
              </div>
            </TabsContent>

            {/* Administrators Tab */}
            <TabsContent value="administrators">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => navigateTab('prev')}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <h3 className="text-lg font-semibold">Event Administrators</h3>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => navigateTab('prev')}>Back</Button>
                  <Button onClick={() => handleSubmit(form.getValues())}>
                    {isEdit ? 'Update Event' : 'Create Event'}
                  </Button>
                </div>
              </div>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}