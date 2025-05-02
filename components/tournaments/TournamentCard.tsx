'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tournament } from '@/services/tournamentsApi';
import { format } from 'date-fns';
import { CalendarIcon, Trophy, Timer, Users } from 'lucide-react';

interface TournamentCardProps {
  tournament: Tournament;
  isRegistered?: boolean;
  onRegister?: () => void;
  onUnregister?: () => void;
}

const modalityNames: Record<string, string> = {
  '3x3': '3×3 Cube',
  '2x2': '2×2 Cube',
  '4x4': '4×4 Cube',
  '5x5': '5×5 Cube',
  '6x6': '6×6 Cube',
  '7x7': '7×7 Cube',
  'pyra': 'Pyraminx',
  'mega': 'Megaminx',
  'skewb': 'Skewb',
  'sq1': 'Square-1',
  'clock': 'Clock'
};

export function TournamentCard({ tournament, isRegistered, onRegister, onUnregister }: TournamentCardProps) {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500 text-white';
      case 'ACTIVE':
        return 'bg-green-500 text-white';
      case 'COMPLETED':
        return 'bg-blue-500 text-white';
      case 'CANCELED':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP p');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{tournament.tournamentName}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <CalendarIcon className="w-4 h-4 mr-1" />
              {formatDate(tournament.startDateTime)}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(tournament.status)}>
            {tournament.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{modalityNames[tournament.modalityId] || tournament.modalityId}</span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">5 solves per competitor</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/tournaments/${tournament.tournamentId}`)}
        >
          View Details
        </Button>

        {tournament.status === 'PENDING' && (
          isRegistered ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={onUnregister}
            >
              Unregister
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={onRegister}
            >
              Register
            </Button>
          )
        )}

        {tournament.status === 'ACTIVE' && isRegistered && (
          <Button
            variant="default"
            size="sm"
            onClick={() => router.push(`/tournaments/${tournament.tournamentId}/compete`)}
          >
            Compete Now
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
