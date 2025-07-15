import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, User, Mail, Phone } from 'lucide-react';

interface TeamContactEditDialogProps {
  team: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (contactData: any) => void;
  isSubmitting: boolean;
}

export function TeamContactEditDialog({ 
  team, 
  open, 
  onOpenChange, 
  onSubmit, 
  isSubmitting 
}: TeamContactEditDialogProps) {
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [headCoachName, setHeadCoachName] = useState('');
  const [headCoachEmail, setHeadCoachEmail] = useState('');
  const [headCoachPhone, setHeadCoachPhone] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Populate form when team data changes
  useEffect(() => {
    if (team && open) {
      setManagerName(team.managerName || '');
      setManagerEmail(team.managerEmail || '');
      setManagerPhone(team.managerPhone || '');
      setHeadCoachName(team.coachData?.headCoachName || '');
      setHeadCoachEmail(team.coachData?.headCoachEmail || '');
      setHeadCoachPhone(team.coachData?.headCoachPhone || '');
      setErrors({});
    }
  }, [team, open]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Manager email is required
    if (!managerEmail) {
      newErrors.managerEmail = 'Manager email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(managerEmail)) {
      newErrors.managerEmail = 'Please enter a valid email address';
    }

    // Manager name is required
    if (!managerName) {
      newErrors.managerName = 'Manager name is required';
    }

    // Validate coach email if provided
    if (headCoachEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(headCoachEmail)) {
      newErrors.headCoachEmail = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const contactData = {
      managerName,
      managerEmail,
      managerPhone: managerPhone || null,
      headCoachName: headCoachName || null,
      headCoachEmail: headCoachEmail || null,
      headCoachPhone: headCoachPhone || null
    };

    onSubmit(contactData);
  };

  if (!team) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Team Contacts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Team Information */}
          <div className="bg-muted p-3 rounded-lg">
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Team</h4>
            <p className="font-semibold">{team.name}</p>
            <p className="text-sm text-muted-foreground">{team.ageGroup?.name || 'No age group'}</p>
          </div>

          {/* Manager Information */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Team Manager
            </h4>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="managerName">Name *</Label>
                <Input
                  id="managerName"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Manager's full name"
                  className={errors.managerName ? 'border-red-500' : ''}
                />
                {errors.managerName && (
                  <p className="text-red-500 text-sm mt-1">{errors.managerName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="managerEmail">Email *</Label>
                <Input
                  id="managerEmail"
                  type="email"
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  placeholder="manager@example.com"
                  className={errors.managerEmail ? 'border-red-500' : ''}
                />
                {errors.managerEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.managerEmail}</p>
                )}
              </div>

              <div>
                <Label htmlFor="managerPhone">Phone</Label>
                <Input
                  id="managerPhone"
                  value={managerPhone}
                  onChange={(e) => setManagerPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Coach Information */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Head Coach
            </h4>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="headCoachName">Name</Label>
                <Input
                  id="headCoachName"
                  value={headCoachName}
                  onChange={(e) => setHeadCoachName(e.target.value)}
                  placeholder="Coach's full name"
                />
              </div>

              <div>
                <Label htmlFor="headCoachEmail">Email</Label>
                <Input
                  id="headCoachEmail"
                  type="email"
                  value={headCoachEmail}
                  onChange={(e) => setHeadCoachEmail(e.target.value)}
                  placeholder="coach@example.com"
                  className={errors.headCoachEmail ? 'border-red-500' : ''}
                />
                {errors.headCoachEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.headCoachEmail}</p>
                )}
              </div>

              <div>
                <Label htmlFor="headCoachPhone">Phone</Label>
                <Input
                  id="headCoachPhone"
                  value={headCoachPhone}
                  onChange={(e) => setHeadCoachPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Contacts
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}