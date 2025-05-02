import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { authApi } from '@/services/authApi';
import { usersApi } from '@/services/usersApi';
import { tournamentsApi } from '@/services/tournamentsApi';
import { solutionsApi } from '@/services/solutionsApi';
import authReducer from '@/features/auth/authSlice';

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [tournamentsApi.reducerPath]: tournamentsApi.reducer,
    [solutionsApi.reducerPath]: solutionsApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      usersApi.middleware,
      tournamentsApi.middleware,
      solutionsApi.middleware,
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;