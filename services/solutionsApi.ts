import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export type SolutionPenalty = 'NONE' | 'PLUS_TWO' | 'DNF';

export interface Solution {
  id: number;
  userId: number;
  scrambleId: number;
  recordedTimeMs: number;
  penalty: SolutionPenalty;
  finalTimeMs: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSolutionDto {
  scrambleId: number;
  recordedTimeMs: number;
  penalty: SolutionPenalty;
}

export const solutionsApi = createApi({
  reducerPath: 'solutionsApi',
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
  tagTypes: ['Solution', 'Solutions', 'TournamentSolutions', 'UserSolutions'],
  endpoints: (builder) => ({
    createSolution: builder.mutation<Solution, CreateSolutionDto>({
      query: (solutionData) => ({
        url: '/solutions',
        method: 'POST',
        body: solutionData,
      }),
      invalidatesTags: ['Solutions', 'TournamentSolutions', 'UserSolutions'],
    }),
    getTournamentSolutions: builder.query<Solution[], string>({
      query: (tournamentId) => `/tournaments/${tournamentId}/solutions`,
      providesTags: (result, error, tournamentId) => [{ type: 'TournamentSolutions', id: tournamentId }],
    }),
    getUserTournamentSolutions: builder.query<Solution[], { tournamentId: string; userId: string }>({
      query: ({ tournamentId, userId }) => 
        `/tournaments/${tournamentId}/users/${userId}/solutions`,
      providesTags: (result, error, { tournamentId, userId }) => [
        { type: 'UserSolutions', id: `${tournamentId}-${userId}` },
      ],
    }),
    getOwnTournamentSolutions: builder.query<Solution[], string>({
      query: (tournamentId) => `/users/me/solutions?tournamentId=${tournamentId}`,
      providesTags: (result, error, tournamentId) => [
        { type: 'UserSolutions', id: `own-${tournamentId}` },
      ],
    }),
  }),
});

export const {
  useCreateSolutionMutation,
  useGetTournamentSolutionsQuery,
  useGetUserTournamentSolutionsQuery,
  useGetOwnTournamentSolutionsQuery,
} = solutionsApi;