import { useParams } from 'wouter';
import GameCardGenerator from '@/components/admin/gamecards/GameCardGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'wouter';

const GameCardsPage = () => {
  const { eventId } = useParams();

  if (!eventId) {
    return <div>Event ID not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/admin/events/${eventId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Event
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Game Cards</h1>
          </div>
        </div>

        {/* Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Professional Game Cards for Tournament</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Generate professional game cards that match tournament standards. These cards include 
              team rosters, coach information, game schedules, and score sheets ready for field use.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Team Roster Cards Include:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Complete player roster with jersey numbers</li>
                  <li>• Coach and manager information</li>
                  <li>• Club logos (when available)</li>
                  <li>• Game schedule templates</li>
                  <li>• Score tracking sections</li>
                  <li>• Official signature areas</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Game Schedule Cards Include:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Game date, time, and field information</li>
                  <li>• Team names and details</li>
                  <li>• Score recording boxes</li>
                  <li>• Referee information section</li>
                  <li>• Official signatures</li>
                  <li>• Print-ready format</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Card Generator */}
        <GameCardGenerator eventId={eventId} />
      </div>
    </div>
  );
};

export default GameCardsPage;