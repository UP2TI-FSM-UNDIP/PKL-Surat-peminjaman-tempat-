import { RouterProvider } from '@tanstack/react-router';
import { type UserRole, router } from './main';

export default function App() {
  const authState = {
    isAuthenticated: true,
    user: {
      id: 1,
      name: 'Admin Ganteng',
      role: 'admin' as UserRole,
    },
  };

  return <RouterProvider router={router} context={{ auth: authState }} />;
}
