import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { User } from './usersApi';

export type ModalityId = '3x3' | '2x2' | '4x4' | '5x5' | '6x6' | '7x7' | 'pyra' | 'mega' | 'skewb' | 'sq1' | 'clock';
export type TournamentStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELED';

export interface Tournament {
  tournamentId: number;
  tournamentName: string;
  startDateTime: string;
  modalityId: ModalityId;
  status: TournamentStatus;
  createdAt: string;
  updatedAt: string;
  createdById: number;
}

export interface CreateTournamentDto {
  tournamentName: string;
  startDateTime: string;
  modalityId: ModalityId;
}

export interface UpdateTournamentDto {
  tournamentName?: string;
  startDateTime?: string;
  status?: TournamentStatus;
}

export interface Registration {
  id: number;
  userId: number;
  tournamentId: number;
  createdAt: string;
}

export interface TournamentAdmin {
  id: number;
  userId: number;
  tournamentId: number;
  createdAt: string;
}

export interface Scramble {
  id: number;
  tournamentId: number;
  scrambleText: string;
  scrambleOrder: number;
}

export const tournamentsApi = createApi({
  reducerPath: 'tournamentsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Tournament', 'Tournaments', 'Registration', 'Registrations', 'Admin', 'Admins', 'Scramble', 'Scrambles'],
  endpoints: (builder) => ({
    createTournament: builder.mutation<Tournament, CreateTournamentDto>({
      query: (tournamentData) => ({
        url: '/tournaments',
        method: 'POST',
        body: tournamentData,
      }),
      invalidatesTags: ['Tournaments'],
    }),
    getAllTournaments: builder.query<Tournament[], void>({
      query: () => '/tournaments',
      providesTags: ['Tournaments'],
    }),
    getTournamentById: builder.query<Tournament, string>({
      query: (id) => `/tournaments/${id}`,
      providesTags: (result, error, id) => [{ type: 'Tournament', id }],
    }),
    updateTournament: builder.mutation<Tournament, { id: string; tournamentData: UpdateTournamentDto }>({
      query: ({ id, tournamentData }) => ({
        url: `/tournaments/${id}`,
        method: 'PATCH',
        body: tournamentData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Tournament', id },
        'Tournaments',
      ],
    }),
    deleteTournament: builder.mutation<void, string>({
      query: (id) => ({
        url: `/tournaments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tournaments'],
    }),
    registerToTournament: builder.mutation<Registration, string>({
      query: (id) => ({
        url: `/tournaments/${id}/registrations`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Registration', id },
        'Registrations',
      ],
    }),
    unregisterFromTournament: builder.mutation<void, string>({
      query: (id) => ({
        url: `/tournaments/${id}/registrations`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Registration', id },
        'Registrations',
      ],
    }),
    getTournamentRegistrations: builder.query<number[], string>({
      query: (id) => `/tournaments/${id}/registrations`,
      providesTags: (result, error, id) => [{ type: 'Registrations', id }],
    }),
    addTournamentAdmin: builder.mutation<TournamentAdmin, { tournamentId: string; userId: number }>({
      query: ({ tournamentId, userId }) => ({
        url: `/tournaments/${tournamentId}/admins`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: (result, error, { tournamentId }) => [
        { type: 'Admin', id: tournamentId },
        'Admins',
      ],
    }),
    removeTournamentAdmin: builder.mutation<void, { tournamentId: string; userId: string }>({
      query: ({ tournamentId, userId }) => ({
        url: `/tournaments/${tournamentId}/admins/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { tournamentId }) => [
        { type: 'Admin', id: tournamentId },
        'Admins',
      ],
    }),
    getTournamentAdmins: builder.query<number[], string>({
      query: (id) => `/tournaments/${id}/admins`,
      providesTags: (result, error, id) => [{ type: 'Admins', id }],
    }),
    getTournamentScrambles: builder.query<Scramble[], string>({
      query: (id) => `/tournaments/${id}/scrambles`,
      providesTags: (result, error, id) => [{ type: 'Scrambles', id }],
    }),
  }),
});

export const {
  useCreateTournamentMutation,
  useGetAllTournamentsQuery,
  useGetTournamentByIdQuery,
  useUpdateTournamentMutation,
  useDeleteTournamentMutation,
  useRegisterToTournamentMutation,
  useUnregisterFromTournamentMutation,
  useGetTournamentRegistrationsQuery,
  useAddTournamentAdminMutation,
  useRemoveTournamentAdminMutation,
  useGetTournamentAdminsQuery,
  useGetTournamentScramblesQuery,
} = tournamentsApi;
