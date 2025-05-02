'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Scramble } from '@/services/tournamentsApi';
import { SolutionPenalty } from '@/services/solutionsApi';

type TimerState = 'idle' | 'ready' | 'inspection' | 'running' | 'stopped';

interface TimerProps {
  scramble?: Scramble;
  onSolutionComplete?: (time: number, penalty: SolutionPenalty) => void;
}

export function Timer({ scramble, onSolutionComplete }: TimerProps) {
  const [time, setTime] = useState(0);
  const [inspectionTime, setInspectionTime] = useState(15);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [penalty, setPenalty] = useState<SolutionPenalty>('NONE');
  
  const startTimeRef = useRef(0);
  const inspectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isTouchDevice = useRef(false);

  // WCA regulation: inspection time starts at 15 seconds
  const inspectionStartTime = 15;

  useEffect(() => {
    // Check if this is a touch device
    isTouchDevice.current = 'ontouchstart' in window;
    
    // Add key event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        handleInteraction(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleInteraction(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (inspectionTimeoutRef.current) {
        clearTimeout(inspectionTimeoutRef.current);
      }
    };
  }, []);

  const startInspection = useCallback(() => {
    setTimerState('inspection');
    setInspectionTime(inspectionStartTime);
    
    const intervalId = setInterval(() => {
      setInspectionTime((prevTime) => {
        // Apply penalties as per WCA regulations
        if (prevTime === 1) {
          setPenalty('PLUS_TWO'); // +2 penalty when inspection exceeds 15 seconds
        }
        if (prevTime === 0) {
          clearInterval(intervalId);
          setPenalty('DNF'); // DNF when inspection exceeds 17 seconds
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    inspectionTimeoutRef.current = intervalId;
    
    return () => {
      if (inspectionTimeoutRef.current) {
        clearInterval(inspectionTimeoutRef.current);
        inspectionTimeoutRef.current = null;
      }
    };
  }, []);

  const startTimer = useCallback(() => {
    if (inspectionTimeoutRef.current) {
      clearInterval(inspectionTimeoutRef.current);
      inspectionTimeoutRef.current = null;
    }
    
    setTimerState('running');
    startTimeRef.current = Date.now();
    
    const updateTimer = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTimeRef.current;
      setTime(elapsedTime);
      
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateTimer);
  }, []);

  const stopTimer = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setTimerState('stopped');
    
    // Call callback with time and penalty if provided
    if (onSolutionComplete) {
      onSolutionComplete(time, penalty);
    }
  }, [time, penalty, onSolutionComplete]);

  const resetTimer = useCallback(() => {
    setTimerState('idle');
    setPenalty('NONE');
  }, []);

  const handleInteraction = useCallback((isDown: boolean) => {
    if (isDown) {
      // On press down
      switch (timerState) {
        case 'idle':
          setTimerState('ready');
          break;
        case 'running':
          stopTimer();
          break;
        case 'inspection':
          setTimerState('ready');
          break;
      }
    } else {
      // On release
      switch (timerState) {
        case 'ready':
          if (timerState === 'ready' && ['idle', 'inspection', 'stopped'].includes(timerState)) {
            startInspection();
          } else if (timerState === 'ready' && timerState === 'inspection') {
            startTimer();
          }
          break;
        case 'inspection':
          startTimer();
          break;
      }
    }
  }, [timerState, startInspection, startTimer, stopTimer]);

  const handleTouchStart = () => handleInteraction(true);
  const handleTouchEnd = () => handleInteraction(false);
  
  const handlePenaltyChange = (newPenalty: SolutionPenalty) => {
    setPenalty(newPenalty);
    
    if (onSolutionComplete && timerState === 'stopped') {
      onSolutionComplete(time, newPenalty);
    }
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
    
    return `${seconds}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="p-6">
        {scramble && (
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Scramble:</h3>
            <p className="text-md font-mono bg-secondary p-3 rounded-md">{scramble.scrambleText}</p>
          </div>
        )}
        
        <div 
          className={cn(
            "w-full h-40 flex items-center justify-center mb-4 rounded-lg transition-colors duration-300 select-none cursor-pointer",
            {
              'bg-secondary': timerState === 'idle',
              'bg-amber-500': timerState === 'ready',
              'bg-red-500': timerState === 'inspection',
              'bg-green-500': timerState === 'running',
              'bg-blue-500': timerState === 'stopped'
            }
          )}
          onTouchStart={isTouchDevice.current ? handleTouchStart : undefined}
          onTouchEnd={isTouchDevice.current ? handleTouchEnd : undefined}
        >
          {timerState === 'inspection' ? (
            <span className="text-6xl font-mono font-bold text-white">
              {inspectionTime}
            </span>
          ) : (
            <span className="text-6xl font-mono font-bold text-white">
              {formatTime(time)}
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 justify-between items-center">
          {timerState === 'stopped' && (
            <>
              <div className="flex items-center gap-2">
                <Button onClick={resetTimer} variant="secondary">
                  Reset
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Penalty: {penalty === 'NONE' ? 'None' : penalty === 'PLUS_TWO' ? '+2' : 'DNF'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handlePenaltyChange('NONE')}>
                      None
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePenaltyChange('PLUS_TWO')}>
                      +2
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePenaltyChange('DNF')}>
                      DNF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {penalty === 'NONE' && `Final time: ${formatTime(time)}`}
                {penalty === 'PLUS_TWO' && `Final time: ${formatTime(time + 2000)} (+2)`}
                {penalty === 'DNF' && 'Final result: DNF'}
              </p>
            </>
          )}
          
          {timerState === 'idle' && (
            <p className="text-sm text-muted-foreground">
              Press space to start inspection
            </p>
          )}
          
          {timerState === 'inspection' && (
            <p className="text-sm text-muted-foreground">
              Press space when ready to start solving
            </p>
          )}
          
          {timerState === 'running' && (
            <p className="text-sm text-muted-foreground">
              Press space to stop the timer
            </p>
          )}
          
          {timerState === 'ready' && (
            <p className="text-sm text-muted-foreground">
              Release space to start
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}