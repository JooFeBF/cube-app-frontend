import { RegisterForm } from '@/components/auth/RegisterForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register | CubeTourneys',
  description: 'Create an account to participate in cube tournaments',
};

export default function RegisterPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-center mb-8">Join CubeTourneys</h1>
      <RegisterForm />
    </div>
  );
}