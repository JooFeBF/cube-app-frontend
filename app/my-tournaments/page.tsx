'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TournamentCard } from '@/components/tournaments/TournamentCard';
import { Plus } from 'lucide-react';
import {
  useGetAllTournamentsQuery,
  useGetTournamentRegistrationsQuery,
  Tournament
} from '@/services/tournamentsApi';
import { useAppSelector } from '@/lib/hooks';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { useGetProfileQuery } from '@/services/usersApi';

export default function MyTournamentsPage() {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { data: profile } = useGetProfileQuery(undefined, { skip: !isAuthenticated });
  const { data: tournaments } = useGetAllTournamentsQuery();

  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [registeredTournaments, setRegisteredTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (tournaments && profile) {
      // Filter tournaments created by the user
      const created = tournaments.filter(t => t.createdById === profile.id);
      setMyTournaments(created);

      // Get tournaments the user is registered for
      const fetchRegistrations = async () => {
        const registered: Tournament[] = [];

        for (const tournament of tournaments) {
          if (tournament.createdById === profile.id) continue; // Skip own tournaments

          try {
            const response = await fetch(`/api/tournaments/${tournament.tournamentId}/registrations`);
            if (response.ok) {
              const userIds = await response.json();
              if (userIds.includes(profile.id)) {
                registered.push(tournament);
              }
            }
          } catch (error) {
            console.error('Error fetching registrations:', error);
          }
        }

        setRegisteredTournaments(registered);
      };

      fetchRegistrations();
    }
  }, [tournaments, profile]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">My Tournaments</h1>

        <Button asChild>
          <Link href="/tournaments/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Tournament
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="created">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="created">Created by Me</TabsTrigger>
          <TabsTrigger value="registered">Registered For</TabsTrigger>
        </TabsList>

        <TabsContent value="created" className="mt-0">
          {myTournaments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  You haven't created any tournaments yet.
                </p>
                <Button asChild>
                  <Link href="/tournaments/new">Create Your First Tournament</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.tournamentId}
                  tournament={tournament}
                  isRegistered={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="registered" className="mt-0">
          {registeredTournaments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  You haven't registered for any tournaments yet.
                </p>
                <Button asChild>
                  <Link href="/tournaments">Browse Tournaments</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registeredTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.tournamentId}
                  tournament={tournament}
                  isRegistered={true}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
