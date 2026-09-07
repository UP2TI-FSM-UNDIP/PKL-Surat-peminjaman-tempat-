// src/utils/documentUtils.ts
import type { Document } from '@/types/document';

export const documentHelpers = {
  // --- 1. Helpers Umum ---
  getRoomInfo: (doc: Document) => {
    const { room_code, room_id } = doc.content || {};
    if (room_id) {
      return `Ruang ${room_code || room_id}`;
    }
    return '-';
  },

  getBookingDate: (doc: Document) => {
    if (doc.content?.booking_date) {
      // Gunakan string jika content.booking_date bertipe string/number
      return new Date(String(doc.content.booking_date)).toLocaleDateString(
        'id-ID',
        {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        },
      );
    }
    return '-';
  },

  getCurrentHolder: (doc: Document) => {
    if (doc.status === 'IN_PROGRESS' && doc.current_holder) {
      return doc.current_holder.role?.name || doc.current_holder.name;
    }
    return '-';
  },

  getEventName: (doc: Document) => {
    // Prioritaskan event_name (diisi di stepper proposal) atas purpose (dari reservasi awal)
    const eventName = doc.content?.event_name || doc.content?.purpose;
    return eventName ? String(eventName) : 'Tidak ada nama';
  },

  // --- 2. Helpers Ketua Pelaksana (Pengganti fungsi lama Anda) ---
  getKetuaPelaksanaNama: (doc: Document) => {
    return doc.content?.ketua_pelaksana_nama
      ? String(doc.content.ketua_pelaksana_nama)
      : '-';
  },

  getKetuaPelaksanaNim: (doc: Document) => {
    return doc.content?.ketua_pelaksana_nim
      ? String(doc.content.ketua_pelaksana_nim)
      : '-';
  },

  getKetuaPelaksanaHp: (doc: Document) => {
    return doc.content?.ketua_pelaksana_hp
      ? String(doc.content.ketua_pelaksana_hp)
      : '-';
  },

  // --- 3. Deadline & Hold Window (14 hari) ---
  /**
   * Hitung deadline pengajuan (14 hari dari created_at)
   */
  getDeadline: (doc: Document) => {
    const createdAt = new Date(doc.created_at);
    const deadline = new Date(createdAt);
    deadline.setDate(deadline.getDate() + 14);
    return deadline;
  },

  /**
   * Hitung sisa hari hingga deadline
   */
  getDaysRemaining: (doc: Document) => {
    const now = new Date();
    const deadline = documentHelpers.getDeadline(doc);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  /**
   * Status deadline: 'expired' | 'critical' | 'warning' | 'safe'
   */
  getDeadlineStatus: (doc: Document) => {
    // Hanya cek untuk dokumen yang belum selesai
    if (doc.status === 'APPROVED' || doc.status === 'REJECTED') {
      return 'safe';
    }

    const daysRemaining = documentHelpers.getDaysRemaining(doc);

    if (daysRemaining < 0) return 'expired';
    if (daysRemaining <= 2) return 'critical';
    if (daysRemaining <= 5) return 'warning';
    return 'safe';
  },

  /**
   * Format text untuk deadline warning
   */
  getDeadlineText: (doc: Document) => {
    const daysRemaining = documentHelpers.getDaysRemaining(doc);
    const deadline = documentHelpers.getDeadline(doc);

    if (daysRemaining < 0) {
      return `Expired ${Math.abs(daysRemaining)} hari lalu`;
    }
    if (daysRemaining === 0) {
      return 'Deadline hari ini!';
    }
    if (daysRemaining === 1) {
      return '1 hari lagi';
    }

    const deadlineStr = deadline.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return `${daysRemaining} hari lagi (${deadlineStr})`;
  },
};
