'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SolutionPenaltyEnum, useGetTournamentSolutionsQuery, useGetUserTournamentSolutionsQuery } from '@/services/solutionsApi';
import { Solution } from '@/services/solutionsApi';
import { User } from '@/services/usersApi';

interface TournamentResultsProps {
  tournamentId: string;
  participants: User[];
}

interface ResultsWithStats {
  userId: number;
  userName: string;
  solutions: Solution[];
  average: number;
  best: number;
}

const formatTime = (milliseconds: number): string => {
  if (milliseconds === Infinity) return 'DNF';

  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const ms = Math.floor((milliseconds % 1000) / 10);

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  return `${seconds}.${ms.toString().padStart(2, '0')}`;
};

const calculateAverage = (solutions: Solution[]): number => {
  if (solutions.length === 0) return Infinity;

  const validTimes = solutions
    .filter(sol => sol.penalty !== 'DNF')
    .map(sol => {
      if (sol.penalty === SolutionPenaltyEnum.PLUS_TWO) {
        return sol.recordedTimeMs + 2000;
      }
      return sol.recordedTimeMs;
    });

  if (validTimes.length < solutions.length - 1) {
    // More than one DNF means the average is DNF
    return Infinity;
  }

  const sortedTimes = [...validTimes].sort((a, b) => a - b);

  // If we have 5 solutions, remove best and worst
  if (solutions.length === 5) {
    // If exactly one DNF, it counts as the worst time
    if (validTimes.length === 4) {
      sortedTimes.shift(); // Remove best time
    } else {
      sortedTimes.shift(); // Remove best time
      sortedTimes.pop();   // Remove worst time
    }
  }

  const sum = sortedTimes.reduce((acc, time) => acc + time, 0);
  return sum / sortedTimes.length;
};

const getBestTime = (solutions: Solution[]): number => {
  if (solutions.length === 0) return Infinity;

  const validTimes = solutions
    .filter(sol => sol.penalty !== SolutionPenaltyEnum.DNF)
    .map(sol => {
      if (sol.penalty === SolutionPenaltyEnum.PLUS_TWO) {
        return sol.recordedTimeMs + 2000;
      }
      return sol.recordedTimeMs;
    });

  if (validTimes.length === 0) return Infinity;
  return Math.min(...validTimes);
};

export function TournamentResults({ tournamentId, participants }: TournamentResultsProps) {
  const { data: solutions, isLoading, error } = useGetTournamentSolutionsQuery(tournamentId);

  const [results, setResults] = useState<ResultsWithStats[]>([]);

  useEffect(() => {
    if (solutions && participants) {
      // Group solutions by user
      const resultsByUser: Record<number, Solution[]> = {};
      participants.forEach(participant => {
        resultsByUser[participant.userId] = [];
      });

      solutions.forEach(solution => {
        if (resultsByUser[solution.userId]) {
          resultsByUser[solution.userId].push(solution);
        }
      });

      // Calculate statistics for each user
      const processedResults: ResultsWithStats[] = participants.map(participant => {
        const userSolutions = resultsByUser[participant.userId] || [];
        return {
          userId: participant.userId,
          userName: participant.userName,
          solutions: userSolutions,
          average: calculateAverage(userSolutions),
          best: getBestTime(userSolutions)
        };
      });

      // Sort by average (DNF last)
      processedResults.sort((a, b) => {
        if (a.average === Infinity && b.average === Infinity) return 0;
        if (a.average === Infinity) return 1;
        if (b.average === Infinity) return -1;
        return a.average - b.average;
      });

      setResults(processedResults);
    }
  }, [solutions, participants]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load results. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tournament Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>Current tournament standings</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Competitor</TableHead>
              <TableHead>Solve 1</TableHead>
              <TableHead>Solve 2</TableHead>
              <TableHead>Solve 3</TableHead>
              <TableHead>Solve 4</TableHead>
              <TableHead>Solve 5</TableHead>
              <TableHead>Average</TableHead>
              <TableHead>Best</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result, index) => (
              <TableRow key={result.userId}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{result.userName}</TableCell>
                {[0, 1, 2, 3, 4].map((solveIndex) => {
                  const solution = result.solutions[solveIndex];
                  let timeDisplay = '—';

                  if (solution) {
                    if (solution.penalty === SolutionPenaltyEnum.DNF) {
                      timeDisplay = 'DNF';
                    } else {
                      const timeMs = solution.recordedTimeMs + (solution.penalty === SolutionPenaltyEnum.PLUS_TWO ? 2000 : 0);
                      timeDisplay = formatTime(timeMs);
                      if (solution.penalty === SolutionPenaltyEnum.PLUS_TWO) {
                        timeDisplay += ' (+2)';
                      }
                    }
                  }

                  return <TableCell key={solveIndex}>{timeDisplay}</TableCell>;
                })}
                <TableCell className="font-semibold">
                  {formatTime(result.average)}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatTime(result.best)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
