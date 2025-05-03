import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export enum SolutionPenaltyEnum {
  OK = 'OK',
  PLUS_TWO = '+2',
  DNF = 'DNF',
}

export interface Solution {
  solutionId: number;
  userId: number;
  scrambleId: number;
  recordedTimeMs: number;
  penalty: SolutionPenaltyEnum;
  finalTimeMs: number;
  createdAt: string;
  updatedAt: string;
  tournamentId?: string;
}

export interface CreateSolutionDto {
  scrambleId: number;
  recordedTimeMs: number;
  penalty: SolutionPenaltyEnum;
  tournamentId: string;
}

type SolutionApiTagType = 'Solution' | 'Solutions' | 'TournamentSolutions' | 'UserSolutions';

type SolutionTagDescription = { type: SolutionApiTagType; id?: string | number };

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
      invalidatesTags: (result, error, arg): ReadonlyArray<SolutionTagDescription> => {
        const tagsToInvalidate: SolutionTagDescription[] = [];
        if (result?.tournamentId) {
          tagsToInvalidate.push({ type: 'TournamentSolutions', id: result.tournamentId });
          const userId = result?.userId;
          if (userId) {
            tagsToInvalidate.push({ type: 'UserSolutions', id: `${result.tournamentId}-${userId}` });
            tagsToInvalidate.push({ type: 'UserSolutions', id: `own-${result.tournamentId}` });
          }
        } else {
          tagsToInvalidate.push({ type: 'TournamentSolutions' });
          tagsToInvalidate.push({ type: 'UserSolutions' });
        }
        return tagsToInvalidate;
      }
    }),
    getTournamentSolutions: builder.query<Solution[], string>({
      query: (tournamentId) => `/tournaments/${tournamentId}/solutions`,
      providesTags: (result, error, tournamentId) =>
        result
          ? [
              { type: 'TournamentSolutions', id: tournamentId },
            ]
          : [{ type: 'TournamentSolutions', id: tournamentId }],
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
    updateSolution: builder.mutation<Solution, Partial<Solution> & Pick<Solution, 'solutionId'>>({
      query: ({ solutionId, ...patchData }) => ({
        url: `/solutions/${solutionId}`,
        method: 'PATCH',
        body: patchData,
      }),
      invalidatesTags: (result, error, arg): ReadonlyArray<SolutionTagDescription> => {
        const tagsToInvalidate: SolutionTagDescription[] = [];
        tagsToInvalidate.push({ type: 'Solutions', id: arg.solutionId });
        if (result?.tournamentId) {
          tagsToInvalidate.push({ type: 'TournamentSolutions', id: result.tournamentId });
          const userId = result?.userId;
          if (userId) {
            tagsToInvalidate.push({ type: 'UserSolutions', id: `${result.tournamentId}-${userId}` });
            tagsToInvalidate.push({ type: 'UserSolutions', id: `own-${result.tournamentId}` });
          }
        } else {
          tagsToInvalidate.push({ type: 'TournamentSolutions' });
          tagsToInvalidate.push({ type: 'UserSolutions' });
        }
        return tagsToInvalidate;
      },
    }),
  }),
});

export const {
  useCreateSolutionMutation,
  useGetTournamentSolutionsQuery,
  useGetUserTournamentSolutionsQuery,
  useGetOwnTournamentSolutionsQuery,
  useUpdateSolutionMutation,
} = solutionsApi;
