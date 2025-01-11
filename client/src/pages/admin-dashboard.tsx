import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { SelectUser } from "@db/schema";
import { 
  Loader2, 
  Search, 
  Plus,
  Settings,
  Users,
  Calendar,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash,
  Copy,
  Eye
} from "lucide-react";

// Type guard function to check if user is admin
function isAdminUser(user: SelectUser | null): user is SelectUser & { isAdmin: true } {
  return user !== null && user.isAdmin === true;
}

export default function AdminDashboard() {
  const { user } = useUser();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isAdminUser(user)) {
      navigate("/");
    }
  }, [user, navigate]);

  const { data: events, isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/admin/events"],
    enabled: isAdminUser(user),
    staleTime: 30000,
    gcTime: 3600000,
  });

  if (!isAdminUser(user)) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border p-4">
        <div className="flex items-center gap-2 mb-8">
          <Calendar className="h-6 w-6" />
          <h1 className="font-semibold text-lg">Soccer Events</h1>
        </div>

        <nav className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <Calendar className="mr-2 h-4 w-4" />
            Events
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Users className="mr-2 h-4 w-4" />
            Teams
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search events..." 
                className="pl-9 w-[300px]"
              />
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          Date
                          <div className="flex flex-col">
                            <ChevronUp className="h-3 w-3" />
                            <ChevronDown className="h-3 w-3" />
                          </div>
                        </div>
                      </TableHead>
                      <TableHead># of Applications</TableHead>
                      <TableHead># of Accepted Teams</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-destructive">
                          Error loading events: {error instanceof Error ? error.message : 'Unknown error'}
                        </TableCell>
                      </TableRow>
                    ) : !events || events.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No events found
                        </TableCell>
                      </TableRow>
                    ) : (
                      events.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>{event.name}</TableCell>
                          <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                          <TableCell>{event.applications}</TableCell>
                          <TableCell>{event.acceptedTeams}</TableCell>
                          <TableCell>
                            <span className={
                              `px-2 py-1 rounded-full text-xs font-medium ${
                                event.status === 'Active' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`
                            }>
                              {event.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}