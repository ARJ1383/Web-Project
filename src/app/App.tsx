import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { Spinner, Toaster } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';

export function App() {
  const ready = useAuthStore((s) => s.ready);
  const restore = useAuthStore((s) => s.restore);

  // Turn the stored refresh token back into a session before routing, so a
  // reload does not bounce a signed-in user to /login.
  useEffect(() => {
    void restore();
  }, [restore]);

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}
