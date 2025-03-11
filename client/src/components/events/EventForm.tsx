// Handle seasonal scope selection
  const handleScopeSelect = (scopeId: number) => {
    console.log('Selected seasonal scope ID:', scopeId);
    setEventData((prev) => ({
      ...prev,
      seasonalScopeId: scopeId
    }));
  };
  // Initialize the form with default values or existing event data if editing
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      seasonalScopeId: initialData.seasonalScopeId || null
    } : {
      isPublic: true,
      ageGroups: [],
      venue: { fields: [] },
      scoring: {},
      schedule: { days: [] },
      customFields: [],
      seasonalScopeId: null
    }
  });

  // Initialize selectedSeasonalScopeId if initialData has a seasonalScopeId
  React.useEffect(() => {
    if (initialData?.seasonalScopeId) {
      setSelectedSeasonalScopeId(initialData.seasonalScopeId);
    }
  }, [initialData]);

{seasonalScopes && (
                    <SeasonalScopeSelector
                      selectedScopeId={selectedSeasonalScopeId}
                      onScopeSelect={(scopeId) => {
                        console.log('Scope selected in EventForm:', scopeId);
                        setSelectedSeasonalScopeId(scopeId);
                        
                        try {
                          // Clear existing age group selections when scope changes
                          const selectedScope = seasonalScopes.find(scope => scope.id === scopeId);
                          if (selectedScope && selectedScope.ageGroups) {
                            console.log('Setting age groups from selected scope:', selectedScope.ageGroups);
                            // Auto-select all age groups from the scope
                            form.setValue('ageGroups', selectedScope.ageGroups);
                            // Also update the form's seasonalScopeId field
                            form.setValue('seasonalScopeId', scopeId);
                          } else {
                            console.warn('Selected scope or age groups not found:', scopeId);
                          }
                        } catch (error) {
                          console.error('Error setting scope-related form values:', error);
                        }
                      }}
                      scopes={seasonalScopes}
                    />
                  )}

const handleSubmitForm = async (data: EventFormValues) => {
    setIsSaving(true);
    try {
      if (!data.name || !data.startDate || !data.endDate || !data.timezone) {
        throw new Error('Required fields are missing');
      }

      if (!selectedSeasonalScopeId) {
        console.warn('No seasonal scope selected, using default if available');
      }

      // Prepare age groups data with only the essential fields
      const preparedAgeGroups = (event.ageGroups || [])
        .map(group => ({
          ...group,
          projectedTeams: group.projectedTeams || 0,
          birthDateStart: `${group.birthYear}-01-01`,
          birthDateEnd: `${group.birthYear}-12-31`,
          amountDue: group.amountDue || 0,
          scoringRule: group.scoringRule || null
        }));

      // Ensure we have a valid seasonalScopeId
      const scopeId = selectedSeasonalScopeId || 
                      data.seasonalScopeId || 
                      defaultValues?.seasonalScopeId;
                      
      console.log('Using seasonal scope ID for submission:', scopeId);

      const combinedData = {
        ...data,
        id: defaultValues?.id, // Make sure ID is included
        seasonalScopeId: scopeId, // Make sure seasonalScopeId is included
        ageGroups: preparedAgeGroups,
        scoringRules,
        settings,
        complexFieldSizes,
        selectedComplexIds,
        administrators: defaultValues?.administrators || [],
        branding: {
          primaryColor,
          secondaryColor,
          logoUrl: previewUrl || undefined,
        },
      };

      console.log("Submitting form data:", combinedData);
      await onSubmit(combinedData);
    } catch (error: any) {
      console.error("Error submitting form:", error);
      // Handle error appropriately, e.g., display an error message to the user
      setIsSaving(false);
      // Optionally, you could set an error state here to display to the user
      // setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };