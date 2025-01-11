import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";

export default function Profile() {
  const { user, logout } = useUser();

  return (
    <div className="min-h-screen bg-background p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium">Username</label>
              <p>{user?.username}</p>
            </div>
            <div>
              <label className="font-medium">Role</label>
              <p>{user?.isParent ? "Parent" : "Player"}</p>
            </div>
            <div>
              <label className="font-medium">Name</label>
              <p>{user?.firstName} {user?.lastName}</p>
            </div>
            <div>
              <label className="font-medium">Email</label>
              <p>{user?.email}</p>
            </div>
            {user?.phone && (
              <div>
                <label className="font-medium">Phone</label>
                <p>{user.phone}</p>
              </div>
            )}
          </div>
          
          <Button 
            variant="destructive" 
            onClick={() => logout()}
            className="mt-8"
          >
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
