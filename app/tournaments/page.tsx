'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TournamentCard } from '@/components/tournaments/TournamentCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import {
  useGetAllTournamentsQuery,
  useRegisterToTournamentMutation,
  useUnregisterFromTournamentMutation,
} from '@/services/tournamentsApi';
import { useAppSelector } from '@/lib/hooks';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { useGetProfileQuery } from '@/services/usersApi';

export default function TournamentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { data: tournaments, isLoading } = useGetAllTournamentsQuery();
  const { data: profile } = useGetProfileQuery(undefined, { skip: !isAuthenticated });
  const [registerToTournament] = useRegisterToTournamentMutation();
  const [unregisterFromTournament] = useUnregisterFromTournamentMutation();

  const [userRegistrations, setUserRegistrations] = useState<{[key: string]: boolean}>({});

  const filteredTournaments = tournaments?.filter(tournament => {
    const matchesSearch = tournament.tournamentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'upcoming' && tournament.status === 'Planned') ||
      (activeTab === 'active' && tournament.status === 'Ongoing') ||
      (activeTab === 'completed' && tournament.status === 'Finished') ||
      (activeTab === 'registered' && userRegistrations[tournament.tournamentId.toString()]);

    return matchesSearch && matchesTab;
  });

  // Fetch registrations for each tournament
  useEffect(() => {
    if (tournaments && isAuthenticated && profile) {
      const fetchRegistrations = async () => {
        const registrationData: {[key: string]: boolean} = {};

        for (const tournament of tournaments) {
          try {
            const response = await fetch(`/api/tournaments/${tournament.tournamentId}/registrations`);
            if (response.ok) {
              const userIds = await response.json();
              registrationData[tournament.tournamentId] = userIds.includes(profile.userId);
            }
          } catch (error) {
            console.error('Error fetching registrations:', error);
          }
        }

        setUserRegistrations(registrationData);
      };

      fetchRegistrations();
    }
  }, [tournaments, isAuthenticated, profile]);

  const handleRegister = async (tournamentId: number) => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = '/login';
      return;
    }

    try {
      await registerToTournament(tournamentId.toString()).unwrap();
      setUserRegistrations(prev => ({
        ...prev,
        [tournamentId]: true
      }));
    } catch (error) {
      console.error('Failed to register:', error);
    }
  };

  const handleUnregister = async (tournamentId: number) => {
    try {
      await unregisterFromTournament(tournamentId.toString()).unwrap();
      setUserRegistrations(prev => ({
        ...prev,
        [tournamentId]: false
      }));
    } catch (error) {
      console.error('Failed to unregister:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Tournaments</h1>

        {isAuthenticated && (
          <Button asChild>
            <Link href="/tournaments/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Tournament
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tournaments..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          {isAuthenticated && (
            <TabsTrigger value="registered">My Registrations</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {isLoading ? (
            <p className="text-center py-8">Loading tournaments...</p>
          ) : filteredTournaments?.length === 0 ? (
            <p className="text-center py-8">No tournaments found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments?.map((tournament) => (
                <TournamentCard
                  key={tournament.tournamentId}
                  tournament={tournament}
                  isRegistered={userRegistrations[tournament.tournamentId]}
                  onRegister={() => handleRegister(tournament.tournamentId)}
                  onUnregister={() => handleUnregister(tournament.tournamentId)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-0">
          {/* Same structure as "all" tab but with filtered results */}
          {isLoading ? (
            <p className="text-center py-8">Loading tournaments...</p>
          ) : filteredTournaments?.length === 0 ? (
            <p className="text-center py-8">No upcoming tournaments found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments?.map((tournament) => (
                <TournamentCard
                  key={tournament.tournamentId}
                  tournament={tournament}
                  isRegistered={userRegistrations[tournament.tournamentId]}
                  onRegister={() => handleRegister(tournament.tournamentId)}
                  onUnregister={() => handleUnregister(tournament.tournamentId)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-0">
          {/* Same structure as "all" tab but with filtered results */}
          {isLoading ? (
            <p className="text-center py-8">Loading tournaments...</p>
          ) : filteredTournaments?.length === 0 ? (
            <p className="text-center py-8">No active tournaments found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments?.map((tournament) => (
                <TournamentCard
                  key={tournament.tournamentId}
                  tournament={tournament}
                  isRegistered={userRegistrations[tournament.tournamentId]}
                  onRegister={() => handleRegister(tournament.tournamentId)}
                  onUnregister={() => handleUnregister(tournament.tournamentId)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          {/* Same structure as "all" tab but with filtered results */}
          {isLoading ? (
            <p className="text-center py-8">Loading tournaments...</p>
          ) : filteredTournaments?.length === 0 ? (
            <p className="text-center py-8">No completed tournaments found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments?.map((tournament) => (
                <TournamentCard
                  key={tournament.tournamentId}
                  tournament={tournament}
                  isRegistered={userRegistrations[tournament.tournamentId]}
                  onRegister={() => handleRegister(tournament.tournamentId)}
                  onUnregister={() => handleUnregister(tournament.tournamentId)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {isAuthenticated && (
          <TabsContent value="registered" className="mt-0">
            {/* Same structure as "all" tab but with filtered results */}
            {isLoading ? (
              <p className="text-center py-8">Loading tournaments...</p>
            ) : filteredTournaments?.length === 0 ? (
              <p className="text-center py-8">You haven't registered for any tournaments yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTournaments?.map((tournament) => (
                  <TournamentCard
                    key={tournament.tournamentId}
                    tournament={tournament}
                    isRegistered={userRegistrations[tournament.tournamentId]}
                    onRegister={() => handleRegister(tournament.tournamentId)}
                    onUnregister={() => handleUnregister(tournament.tournamentId)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
