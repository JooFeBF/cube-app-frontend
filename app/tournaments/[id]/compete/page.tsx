'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Timer } from '@/components/cubing/Timer';
import { ScrambleDisplay } from '@/components/cubing/ScrambleDisplay';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { 
  useGetTournamentByIdQuery,
  useGetTournamentScramblesQuery,
  useGetTournamentRegistrationsQuery,
  Scramble
} from '@/services/tournamentsApi';
import { 
  useCreateSolutionMutation,
  useGetOwnTournamentSolutionsQuery,
  SolutionPenalty
} from '@/services/solutionsApi';
import { useAppSelector } from '@/lib/hooks';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { useGetProfileQuery } from '@/services/usersApi';

export default function CompetePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [currentScrambleIndex, setCurrentScrambleIndex] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [completedSolves, setCompletedSolves] = useState<{[key: number]: boolean}>({});
  
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { data: profile } = useGetProfileQuery(undefined, { skip: !isAuthenticated });
  const { data: tournament, isLoading: tournamentLoading } = useGetTournamentByIdQuery(id);
  const { data: scrambles, isLoading: scramblesLoading } = useGetTournamentScramblesQuery(id);
  const { data: registrations } = useGetTournamentRegistrationsQuery(id);
  const { data: userSolutions } = useGetOwnTournamentSolutionsQuery(id, { skip: !isAuthenticated });
  
  const [createSolution] = useCreateSolutionMutation();
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);
  
  useEffect(() => {
    if (registrations && profile) {
      setIsRegistered(registrations.includes(profile.id));
      
      if (!registrations.includes(profile.id)) {
        router.push(`/tournaments/${id}`);
      }
    }
  }, [registrations, profile, id, router]);
  
  useEffect(() => {
    if (tournament && tournament.status !== 'ACTIVE') {
      router.push(`/tournaments/${id}`);
    }
  }, [tournament, id, router]);
  
  useEffect(() => {
    if (userSolutions && scrambles) {
      const completed: {[key: number]: boolean} = {};
      
      userSolutions.forEach(solution => {
        completed[solution.scrambleId] = true;
      });
      
      setCompletedSolves(completed);
      
      // Find the first incomplete scramble
      for (let i = 0; i < scrambles.length; i++) {
        if (!completed[scrambles[i].id]) {
          setCurrentScrambleIndex(i);
          break;
        }
      }
    }
  }, [userSolutions, scrambles]);
  
  const handleSolutionComplete = async (time: number, penalty: SolutionPenalty) => {
    if (!scrambles) return;
    
    const currentScramble = scrambles[currentScrambleIndex];
    
    try {
      await createSolution({
        scrambleId: currentScramble.id,
        recordedTimeMs: time,
        penalty: penalty
      }).unwrap();
      
      setCompletedSolves(prev => ({
        ...prev,
        [currentScramble.id]: true
      }));
      
      // Move to next scramble if available
      if (currentScrambleIndex < scrambles.length - 1) {
        setCurrentScrambleIndex(currentScrambleIndex + 1);
      }
    } catch (error) {
      console.error('Failed to save solution:', error);
    }
  };
  
  const navigateToScramble = (index: number) => {
    if (scrambles && index >= 0 && index < scrambles.length) {
      setCurrentScrambleIndex(index);
    }
  };
  
  if (tournamentLoading || scramblesLoading || !isAuthenticated || !isRegistered) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center">Loading competition data...</p>
      </div>
    );
  }
  
  if (!tournament || !scrambles || scrambles.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center">Competition data not available</p>
        <Button variant="link" onClick={() => router.push(`/tournaments/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tournament
        </Button>
      </div>
    );
  }
  
  const currentScramble = scrambles[currentScrambleIndex];
  const solveProgress = Object.keys(completedSolves).length / scrambles.length * 100;
  const allSolvesCompleted = Object.keys(completedSolves).length === scrambles.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.push(`/tournaments/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tournament
        </Button>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            Solves completed: {Object.keys(completedSolves).length}/{scrambles.length}
          </span>
          <Progress value={solveProgress} className="w-40" />
        </div>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{tournament.tournamentName}</h1>
        <p className="text-muted-foreground">
          Complete all 5 solves to participate in this tournament
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="space-y-6">
            <ScrambleDisplay 
              scramble={currentScramble} 
              currentScrambleIndex={currentScrambleIndex}
              totalScrambles={scrambles.length}
            />
            
            <Timer 
              scramble={currentScramble}
              onSolutionComplete={handleSolutionComplete}
            />
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Scramble Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                {scrambles.map((scramble, index) => {
                  const isCompleted = completedSolves[scramble.id] || false;
                  const isCurrent = index === currentScrambleIndex;
                  
                  return (
                    <Button 
                      key={scramble.id}
                      variant={isCurrent ? "default" : (isCompleted ? "outline" : "secondary")}
                      className="justify-start"
                      onClick={() => navigateToScramble(index)}
                    >
                      <div className="flex items-center w-full">
                        <span className="mr-2">Scramble {index + 1}</span>
                        {isCompleted && (
                          <span className="ml-auto text-xs bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                            Completed
                          </span>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
              
              {allSolvesCompleted && (
                <div className="mt-6 text-center">
                  <p className="text-green-600 dark:text-green-400 mb-4">
                    All solves completed! View your results in the tournament page.
                  </p>
                  <Button onClick={() => router.push(`/tournaments/${id}`)}>
                    View Results
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}