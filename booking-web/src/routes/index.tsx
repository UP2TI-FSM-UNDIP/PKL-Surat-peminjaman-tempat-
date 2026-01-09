import { createFileRoute } from '@tanstack/react-router';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // a plugin!
import TopBar from '@/components/layouts/TopBar';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <TopBar />
      <div className='flex flex-col items-center justify-center min-h-screen p-4 m-auto'>
        <div className='w-full max-w-6xl'>
          <h1 className='text-center text-3xl font-bold mb-8'>
            Welcome to the Booking App
          </h1>
          <FullCalendar plugins={[dayGridPlugin]} initialView='dayGridMonth' />
        </div>
      </div>
    </div>
  );
}
