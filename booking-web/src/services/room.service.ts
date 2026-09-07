import api from '@/lib/axios';

export interface Room {
  id: number;
  name: string;
  code: string;
  capacity: number;
  facilities?: string[];
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  description?: string;
  building?: string;
  floor?: string;
  location?: string;
  images?: string[];
  image_url?: string;
  created_at: string;
  updated_at: string;
  is_available?: boolean;
}

export interface RoomResponse {
  success: boolean;
  data: {
    data: Room[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface SingleRoomResponse {
  success: boolean;
  data: {
    room: Room;
    upcoming_bookings?: RoomBooking[];
  };
}

export interface RoomBooking {
  id: number;
  document_id: number;
  room_id: number;
  booked_by: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  created_at: string;
  document?: {
    id: number;
    title: string;
    status: string;
    content?: {
      ketua_pelaksana_nama?: string;
      [key: string]: string | undefined;
    };
  };
  bookedBy?: {
    id: number;
    name: string;
    email: string;
    unit?: {
      id: number;
      name: string;
      code: string;
    };
  };
  room?: {
    id: number;
    name: string;
    code: string;
    capacity?: number;
  };
  booked_by_user?: {
    id: number;
    name: string;
    email: string;
    unit_code?: string;
    unit_name?: string;
  } | null;
}

export interface AvailabilityResponse {
  success: boolean;
  data: {
    available: boolean;
    room: Room;
    date: string;
    start_time: string;
    end_time: string;
    conflicts?: RoomBooking[];
  };
}

export interface ScheduleResponse {
  success: boolean;
  data: {
    room: Room;
    start_date: string;
    end_date: string;
    bookings: RoomBooking[];
  };
}

export const roomService = {
  /**
   * Get list ruangan dengan filter
   */
  async getRooms(filters?: {
    status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
    capacity_min?: number;
    search?: string;
    available_date?: string;
    available_start?: string;
    available_end?: string;
  }): Promise<Room[]> {
    const response = await api.get<RoomResponse>('/rooms', { params: filters });
    // Backend returns paginated response
    return response.data.data?.data ?? [];
  },

  /**
   * Get detail ruangan dengan upcoming bookings
   */
  async getRoom(id: number): Promise<SingleRoomResponse['data']> {
    const response = await api.get<SingleRoomResponse>(`/rooms/${id}`);
    return response.data.data;
  },

  /**
   * Cek ketersediaan ruangan pada waktu tertentu
   */
  async checkAvailability(
    roomId: number,
    date: string,
    startTime: string,
    endTime: string,
    excludeDocumentId?: number, // Parameter baru untuk exclude document saat edit
  ): Promise<AvailabilityResponse['data']> {
    const payload: any = {
      date,
      start_time: startTime,
      end_time: endTime,
    };

    // Tambahkan exclude document ID jika ada (untuk edit mode)
    if (excludeDocumentId) {
      payload.exclude_document_id = excludeDocumentId;
    }

    const response = await api.post<AvailabilityResponse>(
      `/rooms/${roomId}/check-availability`,
      payload,
    );
    return response.data.data;
  },

  /**
   * Get jadwal booking ruangan pada range tanggal
   */
  async getRoomSchedule(
    roomId: number,
    startDate: string,
    endDate: string,
  ): Promise<ScheduleResponse['data']> {
    const response = await api.get<ScheduleResponse>(
      `/rooms/${roomId}/schedule?start_date=${startDate}&end_date=${endDate}`,
    );
    // Null-safe: jika data atau bookings undefined, kembalikan struktur aman
    return {
      ...response.data.data,
      bookings: response.data.data?.bookings ?? [],
    };
  },

  /**
   * Create ruangan baru (admin/unit manager)
   */
  async createRoom(data: FormData): Promise<Room> {
    const response = await api.post<{ success: boolean; data: Room }>(
      '/rooms',
      data,
    );
    return response.data.data;
  },

  /**
   * Update ruangan (admin/unit manager)
   */
  async updateRoom(
    id: number,
    data: {
      name?: string;
      code?: string;
      capacity?: number;
      facilities?: string[];
      description?: string;
      images?: string[];
      status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
    },
  ): Promise<Room> {
    const response = await api.put<{ success: boolean; data: Room }>(
      `/rooms/${id}`,
      data,
    );
    return response.data.data;
  },

  /**
   * Delete ruangan (admin/unit manager)
   */
  async deleteRoom(id: number): Promise<void> {
    await api.delete(`/rooms/${id}`);
  },

  /**
   * Upload foto ruangan (admin/unit manager)
   */
  async uploadImage(
    roomId: number,
    image: File,
  ): Promise<{ path: string; url: string }> {
    const formData = new FormData();
    formData.append('image', image);

    const response = await api.post<{
      success: boolean;
      data: { path: string; url: string; all_images: string[] };
    }>(`/rooms/${roomId}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * Hapus foto ruangan (admin/unit manager)
   */
  async deleteImage(roomId: number, path: string): Promise<void> {
    await api.delete(`/rooms/${roomId}/images`, {
      data: { path },
    });
  },

  /**
   * Get all room bookings with optional filters
   */
  async getBookings(filters?: {
    room_id?: number;
    status?: string;
    date_from?: string;
    date_to?: string;
    my_bookings?: boolean;
  }): Promise<RoomBooking[]> {
    const response = await api.get<{ success: boolean; data: { data: RoomBooking[] } }>(
      '/room-bookings',
      { params: filters },
    );
    // Backend returns paginated response
    return response.data.data?.data ?? [];
  },

  /**
   * Delete a room booking (soft delete)
   */
  async deleteBooking(id: number): Promise<void> {
    await api.delete(`/room-bookings/${id}`);
  },
};
