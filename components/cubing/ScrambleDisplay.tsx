'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scramble } from '@/services/tournamentsApi';

interface ScrambleDisplayProps {
  scramble: Scramble;
  currentScrambleIndex: number;
  totalScrambles: number;
}

export function ScrambleDisplay({
  scramble,
  currentScrambleIndex,
  totalScrambles
}: ScrambleDisplayProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Scramble {currentScrambleIndex + 1}/{totalScrambles}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-mono text-sm md:text-base bg-secondary p-3 rounded-md">
          {scramble.scrambleSequence}
        </p>
      </CardContent>
    </Card>
  );
}
