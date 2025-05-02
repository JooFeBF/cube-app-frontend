import { LoginForm } from '@/components/auth/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | CubeTourneys',
  description: 'Login to your account to participate in cube tournaments',
};

export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-center mb-8">Welcome Back</h1>
      <LoginForm />
    </div>
  );
}