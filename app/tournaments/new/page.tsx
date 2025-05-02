'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreateTournamentForm } from '@/components/tournaments/CreateTournamentForm';
import { useAppSelector } from '@/lib/hooks';
import { selectIsAuthenticated } from '@/features/auth/authSlice';

export default function NewTournamentPage() {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
  
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-center mb-8">Create a New Tournament</h1>
      <CreateTournamentForm />
    </div>
  );
}