import { createContext, useContext, useState, type ReactNode } from 'react';

export interface BookingFormData {
    // Step 1: Detail Tempat
    room_id?: number;
    room_code?: string;
    booking_date?: string;
    start_time?: string;
    end_time?: string;
    purpose?: string;

    // Ketua Pelaksana Info
    ketua_pelaksana_nama?: string;
    ketua_pelaksana_nim?: string;
    ketua_pelaksana_hp?: string;

    // Step 2: Proposal
    event_name?: string;
    event_nature?: string;
    event_form?: string;
    objectives?: string;
    benefits?: string;
    target_audience?: string;
    schedule?: string;
    location?: string;
    equipment?: string;
    committee_head?: string;
    invitations?: string;
    proposal_file?: File | null;

    // Document ID (created after step 1)
    document_id?: number;
}

interface BookingContextType {
    formData: BookingFormData;
    updateFormData: (data: Partial<BookingFormData>) => void;
    resetFormData: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
    const [formData, setFormData] = useState<BookingFormData>({});

    const updateFormData = (data: Partial<BookingFormData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    const resetFormData = () => {
        setFormData({});
    };

    return (
        <BookingContext.Provider value={{ formData, updateFormData, resetFormData }}>
            {children}
        </BookingContext.Provider>
    );
}

export function useBookingContext() {
    const context = useContext(BookingContext);
    if (!context) {
        throw new Error('useBookingContext must be used within BookingProvider');
    }
    return context;
}
