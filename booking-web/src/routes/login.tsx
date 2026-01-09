import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/login')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', { email, password });
    // TODO: Implement login logic
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => navigate({ to: '/' })}
          className='mb-4 -mt-2'
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Kembali
        </Button>

        <div className='text-center'>
          <h1 className='text-3xl font-bold text-gray-900'>Login</h1>
          <p className='mt-2 text-sm text-gray-600'>Masuk ke akun Anda</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-700'
            >
              Email
            </label>
            <Input
              id='email'
              type='email'
              placeholder='nama@example.com'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className='space-y-2'>
            <label
              htmlFor='password'
              className='block text-sm font-medium text-gray-700'
            >
              Password
            </label>
            <Input
              id='password'
              type='password'
              placeholder='••••••••'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <input
                id='remember'
                type='checkbox'
                className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
              />
              <label
                htmlFor='remember'
                className='ml-2 block text-sm text-gray-700'
              >
                Ingat saya
              </label>
            </div>

            <a
              href='#'
              className='text-sm font-medium text-blue-600 hover:text-blue-500'
            >
              Lupa password?
            </a>
          </div>

          <Button type='submit' className='w-full'>
            Masuk
          </Button>
        </form>
      </div>
    </div>
  );
}
