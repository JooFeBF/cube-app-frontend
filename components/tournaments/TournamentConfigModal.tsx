'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tournament,
  UpdateTournamentDto,
  useUpdateTournamentMutation,
  useGetTournamentAdminsQuery,
  useAddTournamentAdminMutation,
  useRemoveTournamentAdminMutation,
} from '@/services/tournamentsApi';
import { useGetAllUsersQuery, User } from '@/services/usersApi';

const tournamentSchema = z.object({
  tournamentName: z.string().min(3, { message: 'Tournament name must be at least 3 characters' }),
  startDateTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Please enter a valid date and time',
  }),
  status: z.enum(['Planned', 'Ongoing', 'Finished', 'Cancelled']),
});

interface TournamentConfigModalProps {
  tournament: Tournament;
  isOpen: boolean;
  onClose: () => void;
}

export function TournamentConfigModal({ tournament, isOpen, onClose }: TournamentConfigModalProps) {
  const [updateTournament, { isLoading }] = useUpdateTournamentMutation();
  const [addAdmin] = useAddTournamentAdminMutation();
  const [removeAdmin] = useRemoveTournamentAdminMutation();
  const { data: admins = [] } = useGetTournamentAdminsQuery(tournament.tournamentId.toString());
  const { data: users = [] } = useGetAllUsersQuery();
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const form = useForm<z.infer<typeof tournamentSchema>>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      tournamentName: tournament.tournamentName,
      startDateTime: new Date(tournament.startDateTime).toISOString().slice(0, 16),
      status: tournament.status,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        tournamentName: tournament.tournamentName,
        startDateTime: new Date(tournament.startDateTime).toISOString().slice(0, 16),
        status: tournament.status,
      });
    }
  }, [isOpen, tournament, form]);

  const onSubmit = async (data: z.infer<typeof tournamentSchema>) => {
    try {
      setError(null);
      await updateTournament({
        id: tournament.tournamentId.toString(),
        tournamentData: {
          tournamentName: data.tournamentName,
          startDateTime: data.startDateTime,
          status: data.status,
        },
      }).unwrap();
      onClose();
    } catch (err: any) {
      setError(err.data?.message || 'Failed to update tournament');
    }
  };

  const handleAddAdmin = async () => {
    if (!selectedUserId) return;

    try {
      setError(null);
      await addAdmin({
        tournamentId: tournament.tournamentId.toString(),
        userId: parseInt(selectedUserId),
      }).unwrap();
      setSelectedUserId('');
    } catch (err: any) {
      setError(err.data?.message || 'Failed to add admin');
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    try {
      setError(null);
      await removeAdmin({
        tournamentId: tournament.tournamentId.toString(),
        userId,
      }).unwrap();
    } catch (err: any) {
      setError(err.data?.message || 'Failed to remove admin');
    }
  };

  const adminUsers = users.filter(user => admins.includes(user.userId));
  const nonAdminUsers = users.filter(user => !admins.includes(user.userId));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Configure Tournament</DialogTitle>
          <DialogDescription>
            Update tournament settings and manage administrators
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="settings">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="admins">Administrators</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="tournamentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tournament Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Planned">Planned</SelectItem>
                          <SelectItem value="Ongoing">Ongoing</SelectItem>
                          <SelectItem value="Finished">Finished</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="admins">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {nonAdminUsers.map((user) => (
                      <SelectItem key={user.userId} value={user.userId.toString()}>
                        {user.userName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddAdmin} disabled={!selectedUserId}>
                  Add Admin
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Current Administrators</h3>
                {adminUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No administrators added yet</p>
                ) : (
                  <div className="space-y-2">
                    {adminUsers.map((admin) => (
                      <div key={admin.userId} className="flex items-center justify-between p-2 border rounded-md">
                        <span>{admin.userName}</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveAdmin(admin.userId.toString())}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
