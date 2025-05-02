'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TournamentResults } from '@/components/tournaments/TournamentResults';
import { CalendarIcon, Trophy, Users, Timer, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import {
  useGetTournamentByIdQuery,
  useRegisterToTournamentMutation,
  useUnregisterFromTournamentMutation,
  useGetTournamentRegistrationsQuery,
  useUpdateTournamentMutation,
  Tournament
} from '@/services/tournamentsApi';
import { useGetAllUsersQuery, User } from '@/services/usersApi';
import { useAppSelector } from '@/lib/hooks';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { useGetProfileQuery } from '@/services/usersApi';

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

export default function TournamentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [isUserRegistered, setIsUserRegistered] = useState(false);
  const [participants, setParticipants] = useState<User[]>([]);

  const { data: tournament, isLoading } = useGetTournamentByIdQuery(id);
  const { data: registrations } = useGetTournamentRegistrationsQuery(id);
  const { data: allUsers } = useGetAllUsersQuery();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { data: profile } = useGetProfileQuery(undefined, { skip: !isAuthenticated });

  const [registerToTournament] = useRegisterToTournamentMutation();
  const [unregisterFromTournament] = useUnregisterFromTournamentMutation();
  const [updateTournament] = useUpdateTournamentMutation();

  useEffect(() => {
    if (registrations && profile) {
      setIsUserRegistered(registrations.includes(profile.id));
    }
  }, [registrations, profile]);

  useEffect(() => {
    if (registrations && allUsers) {
      const participantsList = allUsers.filter(user =>
        registrations.includes(user.id)
      );
      setParticipants(participantsList);
    }
  }, [registrations, allUsers]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      await registerToTournament(id).unwrap();
      setIsUserRegistered(true);
    } catch (error) {
      console.error('Failed to register:', error);
    }
  };

  const handleUnregister = async () => {
    try {
      await unregisterFromTournament(id).unwrap();
      setIsUserRegistered(false);
    } catch (error) {
      console.error('Failed to unregister:', error);
    }
  };

  const startTournament = async () => {
    if (!tournament) return;

    try {
      await updateTournament({
        id,
        tournamentData: {
          status: 'ACTIVE'
        }
      }).unwrap();
    } catch (error) {
      console.error('Failed to start tournament:', error);
    }
  };

  const completeTournament = async () => {
    if (!tournament) return;

    try {
      await updateTournament({
        id,
        tournamentData: {
          status: 'COMPLETED'
        }
      }).unwrap();
    } catch (error) {
      console.error('Failed to complete tournament:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center">Loading tournament details...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center">Tournament not found</p>
        <Button variant="link" onClick={() => router.push('/tournaments')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tournaments
        </Button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP p');
    } catch (e) {
      return dateString;
    }
  };

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

  const isCreator = profile && profile.id === tournament.createdById;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="outline" className="mb-6" onClick={() => router.push('/tournaments')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Tournaments
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-3xl">{tournament.tournamentName}</CardTitle>
                  <p className="text-muted-foreground mt-2 flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDate(tournament.startDateTime)}
                  </p>
                </div>
                <Badge className={getStatusColor(tournament.status)}>
                  {tournament.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-muted-foreground" />
                  <span>{modalityNames[tournament.modalityId] || tournament.modalityId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span>{participants.length} participants registered</span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-muted-foreground" />
                  <span>5 solves per competitor</span>
                </div>
              </div>

              {tournament.status === 'PENDING' && (
                <div className="mt-4">
                  {isUserRegistered ? (
                    <Button
                      variant="destructive"
                      onClick={handleUnregister}
                    >
                      Unregister from Tournament
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      onClick={handleRegister}
                    >
                      Register for Tournament
                    </Button>
                  )}

                  {isCreator && (
                    <Button
                      variant="default"
                      className="ml-4"
                      onClick={startTournament}
                    >
                      Start Tournament
                    </Button>
                  )}
                </div>
              )}

              {tournament.status === 'ACTIVE' && (
                <div className="mt-4">
                  {isUserRegistered && (
                    <Button
                      variant="default"
                      onClick={() => router.push(`/tournaments/${tournament.tournamentId}/compete`)}
                    >
                      Compete Now
                    </Button>
                  )}

                  {isCreator && (
                    <Button
                      variant="default"
                      className="ml-4"
                      onClick={completeTournament}
                    >
                      Complete Tournament
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6">
            <Tabs defaultValue="results">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="participants">Participants</TabsTrigger>
              </TabsList>
              <TabsContent value="results" className="mt-6">
                <TournamentResults tournamentId={id} participants={participants} />
              </TabsContent>
              <TabsContent value="participants" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Registered Participants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {participants.length === 0 ? (
                      <p className="text-muted-foreground">No participants registered yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {participants.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center space-x-3 p-3 border rounded-md"
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="font-semibold text-primary">{user.userName.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-medium">{user.userName}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Format</h3>
                <p className="text-sm text-muted-foreground">
                  Each competitor receives 5 scrambles and records their solution times.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Timing</h3>
                <p className="text-sm text-muted-foreground">
                  WCA rules apply: 15 seconds inspection time before solving.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Penalties</h3>
                <p className="text-sm text-muted-foreground">
                  +2 seconds for exceeding inspection time or minor violations.
                  DNF for invalid solves or major violations.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Scoring</h3>
                <p className="text-sm text-muted-foreground">
                  Best and worst times are discarded, average of middle 3 solves determines ranking.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
