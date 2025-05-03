'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateTournamentMutation } from '@/services/tournamentsApi';
import { ModalityId } from '@/services/tournamentsApi';

const createTournamentSchema = z.object({
  tournamentName: z.string().min(3, { message: 'Tournament name must be at least 3 characters' }),
  startDateTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Please enter a valid date and time',
  }),
  modalityId: z.enum(['3x3', '2x2', '4x4', '5x5', '6x6', '7x7', 'pyra', 'mega', 'skewb', 'sq1', 'clock'] as const),
});

type CreateTournamentFormValues = z.infer<typeof createTournamentSchema>;

const modalities = [
  { modalityId: '3x3', name: '3×3 Cube' },
  { modalityId: '2x2', name: '2×2 Cube' },
  { modalityId: '4x4', name: '4×4 Cube' },
  { modalityId: '5x5', name: '5×5 Cube' },
  { modalityId: '6x6', name: '6×6 Cube' },
  { modalityId: '7x7', name: '7×7 Cube' },
  { modalityId: 'pyra', name: 'Pyraminx' },
  { modalityId: 'mega', name: 'Megaminx' },
  { modalityId: 'skewb', name: 'Skewb' },
  { modalityId: 'sq1', name: 'Square-1' },
  { modalityId: 'clock', name: 'Clock' },
];

export function CreateTournamentForm() {
  const router = useRouter();
  const [createTournament, { isLoading }] = useCreateTournamentMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<CreateTournamentFormValues>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: {
      tournamentName: '',
      startDateTime: '',
      modalityId: '3x3' as ModalityId,
    },
  });

  const onSubmit = async (data: CreateTournamentFormValues) => {
    try {
      setErrorMessage(null);
      await createTournament({
        tournamentName: data.tournamentName,
        startDateTime: data.startDateTime,
        modalityId: data.modalityId,
      }).unwrap();
      router.push('/tournaments');
    } catch (err: any) {
      if (err.data?.message) {
        setErrorMessage(err.data.message);
      } else {
        setErrorMessage('Failed to create tournament. Please try again later.');
      }
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Create Tournament</CardTitle>
        <CardDescription>
          Set up a new Rubik's Cube tournament for competitors
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="tournamentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tournament Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Summer Speed Cubing 2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDateTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date & Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormDescription>
                    When will the tournament begin?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="modalityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {modalities.map((modality) => (
                        <SelectItem key={modality.modalityId} value={modality.modalityId}>
                          {modality.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Which cube/puzzle will be used in this tournament?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Tournament'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="link" onClick={() => router.push('/tournaments')}>
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}
