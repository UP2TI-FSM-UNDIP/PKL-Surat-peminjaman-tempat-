import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; // Import App yang sudah dipisah
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
export type UserRole = 'admin' | 'mahasiswa' | 'dosen';

export interface User {
  id: number;
  name: string;
  role: UserRole;
}

export interface MyRouterContext {
  auth: {
    isAuthenticated: boolean;
    user: User | null;
  };
}

export const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
