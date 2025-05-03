'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Scramble } from '@/services/tournamentsApi';
import { SolutionPenaltyEnum } from '@/services/solutionsApi';


type TimerState = 'idle' | 'inspection' | 'running' | 'stopped';

interface TimerProps {
  scramble?: Scramble;
  onSolutionComplete?: (time: number, penalty: SolutionPenaltyEnum) => void;
  onPenaltyChange?: (penalty: SolutionPenaltyEnum) => void;
  selectedSolve?: {
    solutionId: number;
    scrambleId: number;
    recordedTimeMs: number;
    penalty: SolutionPenaltyEnum;
    finalTimeMs: number;
  };
}


const INSPECTION_START_TIME = 15000;
const PENALTY_PLUS_TWO_THRESHOLD = 15000;
const PENALTY_DNF_THRESHOLD = 17000;

export function Timer({ scramble, onSolutionComplete, onPenaltyChange, selectedSolve }: TimerProps) {

  const [displayedTime, setDisplayedTime] = useState(0);

  const [timerState, setTimerState] = useState<TimerState>('idle');

  const [penalty, setPenalty] = useState<SolutionPenaltyEnum>(SolutionPenaltyEnum.OK);

  useEffect(() => {
    if (selectedSolve) {
      setDisplayedTime(selectedSolve.recordedTimeMs);
      setPenalty(selectedSolve.penalty);
      setTimerState('stopped');
    } else {
      setDisplayedTime(0);
      setPenalty(SolutionPenaltyEnum.OK);
      setTimerState('idle');
    }
  }, [selectedSolve]);


  const inspectionStartTimeRef = useRef<number>(0);
  const solveStartTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const isTouchDevice = useRef<boolean>(false);
  const timerStateRef = useRef<TimerState>(timerState);


  useEffect(() => {
    timerStateRef.current = timerState;
  }, [timerState]);


  const stopRafLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);



  const runTimerLoop = useCallback(() => {
    stopRafLoop();

    const loop = () => {
      const now = Date.now();

      const currentTimerState = timerStateRef.current;

      if (currentTimerState === 'inspection') {
        const inspectionElapsed = now - inspectionStartTimeRef.current;

        const inspectionRemaining = Math.max(0, INSPECTION_START_TIME - inspectionElapsed);

        setDisplayedTime(Math.ceil(inspectionRemaining / 1000));



        if (inspectionElapsed > PENALTY_DNF_THRESHOLD) {
          setPenalty(SolutionPenaltyEnum.DNF);
        } else if (inspectionElapsed > PENALTY_PLUS_TWO_THRESHOLD) {
          setPenalty(SolutionPenaltyEnum.PLUS_TWO);
        } else {
          setPenalty(SolutionPenaltyEnum.OK);
        }
      } else if (currentTimerState === 'running') {

        const solveElapsed = now - solveStartTimeRef.current;
        setDisplayedTime(solveElapsed);
      } else {

         stopRafLoop();
         return;
      }


      animationFrameRef.current = requestAnimationFrame(loop);
    };


    animationFrameRef.current = requestAnimationFrame(loop);
  }, [stopRafLoop]);


  const startInspection = useCallback(() => {
    setPenalty(SolutionPenaltyEnum.OK);
    setDisplayedTime(Math.ceil(INSPECTION_START_TIME / 1000));
    inspectionStartTimeRef.current = Date.now();
    setTimerState('inspection');
    runTimerLoop();
  }, [runTimerLoop]);

  const startTimer = useCallback(() => {

    const inspectionElapsed = Date.now() - inspectionStartTimeRef.current;
    let finalPenalty = SolutionPenaltyEnum.OK;
    if (inspectionElapsed > PENALTY_DNF_THRESHOLD) {
        finalPenalty = SolutionPenaltyEnum.DNF;
    } else if (inspectionElapsed > PENALTY_PLUS_TWO_THRESHOLD) {
        finalPenalty = SolutionPenaltyEnum.PLUS_TWO;
    }
    setPenalty(finalPenalty);

    solveStartTimeRef.current = Date.now();
    setTimerState('running');
    setDisplayedTime(0);

    if (!animationFrameRef.current) {
        runTimerLoop();
    }
  }, [runTimerLoop]);

  const stopTimer = useCallback((forceDNF = false) => {
    stopRafLoop();

    const finalTime = solveStartTimeRef.current > 0 ? Date.now() - solveStartTimeRef.current : 0;

    const finalPenalty = forceDNF ? SolutionPenaltyEnum.DNF : penalty;

    setDisplayedTime(finalTime);
    setPenalty(finalPenalty);
    setTimerState('stopped');


    if (onSolutionComplete) {
      onSolutionComplete(finalTime, finalPenalty);
    }
  }, [stopRafLoop, penalty, onSolutionComplete]);

  const resetTimer = useCallback(() => {
    stopRafLoop();
    setTimerState('idle');
    setDisplayedTime(0);
    setPenalty(SolutionPenaltyEnum.OK);
    inspectionStartTimeRef.current = 0;
    solveStartTimeRef.current = 0;
  }, [stopRafLoop]);



  const handleInteraction = useCallback(() => {
      const currentTimerState = timerStateRef.current;
      switch (currentTimerState) {
          case 'idle':
              startInspection();
              break;
          case 'stopped':
              resetTimer();
              break;
          case 'inspection':
              startTimer();
              break;
          case 'running':
              stopTimer();
              break;
      }
  }, [startInspection, startTimer, stopTimer, resetTimer]);


  const latestInteractionHandler = useRef(handleInteraction);
  useEffect(() => {

    latestInteractionHandler.current = handleInteraction;
  }, [handleInteraction]);


  useEffect(() => {

    isTouchDevice.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;


    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' && !e.repeat) {
            e.preventDefault();

            latestInteractionHandler.current();
        }
    };


    const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        latestInteractionHandler.current();
    };

    window.addEventListener('keydown', handleKeyDown);

    const timerDiv = document.getElementById('timer-touch-area');
    if (timerDiv && isTouchDevice.current) {

         timerDiv.addEventListener('touchstart', handleTouchStart, { passive: false });
    }


    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        if (timerDiv && isTouchDevice.current) {
            timerDiv.removeEventListener('touchstart', handleTouchStart);
        }
        stopRafLoop();
    };


  }, []);


  const handlePenaltyChange = (newPenalty: SolutionPenaltyEnum) => {
    setPenalty(newPenalty);
    if (onPenaltyChange) {
      onPenaltyChange(newPenalty);
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


   const getTimerDisplayClasses = () => {
      switch (timerState) {
         case 'idle': return 'bg-secondary text-secondary-foreground';
         case 'inspection': return 'bg-amber-500 text-white';
         case 'running': return 'bg-green-500 text-white';
         case 'stopped': return 'bg-blue-500 text-white';
         default: return 'bg-secondary text-secondary-foreground';
     }
  }


  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="p-6">
        {scramble && (
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Scramble:</h3>
            <p className="text-md font-mono bg-secondary p-3 rounded-md break-words">
              {scramble.scrambleSequence}
            </p>
          </div>
        )}

        {/* Main Timer Display Area */}
        <div
          id="timer-touch-area"
          className={cn(
            'w-full h-48 flex items-center justify-center mb-4 rounded-lg transition-colors duration-100 select-none cursor-pointer text-center',
            getTimerDisplayClasses()
          )}
        >
          {/* Display inspection time or solve time */}
          {timerState === 'inspection' ? (
            <span className="text-7xl font-mono font-bold">
              {displayedTime}
            </span>
          ) : (
            <span className="text-7xl font-mono font-bold">
                {
                  timerState === 'running'
                    ? formatTime(displayedTime)
                    : formatTime(selectedSolve?.recordedTimeMs || 0)
                }
            </span>
          )}
        </div>

        {/* Controls and Status Area */}
        <div className="flex flex-wrap gap-2 justify-between items-center min-h-[40px]">
          {/* Show controls only when stopped */}
          {timerState === 'stopped' && (
            <>
              <div className="flex items-center gap-2">
                {/* Reset Button */}
                <Button onClick={resetTimer} variant="secondary" size="sm">
                  Reset / Next
                </Button>

                {/* Penalty Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Penalty:{' '}
                      {
                        penalty === SolutionPenaltyEnum.OK
                          ? 'None'
                          : penalty === SolutionPenaltyEnum.PLUS_TWO
                          ? '+2'
                          : 'DNF'
                      }
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handlePenaltyChange(SolutionPenaltyEnum.OK)}>None</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePenaltyChange(SolutionPenaltyEnum.PLUS_TWO)}>+2</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePenaltyChange(SolutionPenaltyEnum.DNF)}>DNF</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

               {/* Final Time Display */}
              <p className="text-sm text-muted-foreground font-semibold">
                {penalty === SolutionPenaltyEnum.OK && `Final: ${formatTime(displayedTime)}`}
                {penalty === SolutionPenaltyEnum.PLUS_TWO && `Final: ${formatTime(displayedTime + 2000)} (+2)`}
                {penalty === SolutionPenaltyEnum.DNF && 'Final: DNF'}
              </p>
            </>
          )}

          {/* User Guidance Text */}
          {timerState === 'idle' && ( <p className="text-sm text-muted-foreground w-full text-center">Press Space / Touch to Start Inspection</p> )}
          {timerState === 'inspection' && ( <p className="text-sm text-muted-foreground w-full text-center">Inspection... Press Space / Touch to Start Timer</p> )}
          {timerState === 'running' && ( <p className="text-sm text-muted-foreground w-full text-center">Solving... Press Space / Touch to Stop</p> )}
          {timerState === 'stopped' && ( <p className="text-sm text-muted-foreground w-full text-center">Stopped. Press Space / Touch to Reset.</p> )}

        </div>
      </CardContent>
    </Card>
  );
}
