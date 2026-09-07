export interface ReservationContent {
  room_id: number;
  room_code?: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  ketua_pelaksana_nama: string;
  ketua_pelaksana_nim: string;
  ketua_pelaksana_hp: string;
}

export interface BookingFormState {
  roomId: number | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  activity: string;
  ketua: {
    nama: string;
    nim: string;
    hp: string;
  };
}
