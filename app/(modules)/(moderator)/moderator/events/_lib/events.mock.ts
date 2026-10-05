import type { ModerationEvent } from './events.types';

// Dữ liệu mẫu độc lập với component; thay bằng dữ liệu API khi tích hợp.
export const pendingEvents: ModerationEvent[] = [
  { id: 'EVT-001', name: 'Summer Music Festival', category: 'Âm nhạc', organizer: 'Live Nation Vietnam', location: 'SECC, TP. Hồ Chí Minh', date: '12/10/2026 · 18:00', submittedAt: '15 phút trước', tickets: 2500, color: 'violet' },
  { id: 'EVT-002', name: 'AI & Future Workshop', category: 'Workshop', organizer: 'AI Vietnam Community', location: 'Dreamplex, TP. Hồ Chí Minh', date: '15/10/2026 · 09:00', submittedAt: '42 phút trước', tickets: 150, color: 'blue' },
  { id: 'EVT-003', name: 'Vietnam Tech Conference', category: 'Hội nghị', organizer: 'TechConnect', location: 'GEM Center, TP. Hồ Chí Minh', date: '18/10/2026 · 08:30', submittedAt: '1 giờ trước', tickets: 800, color: 'orange' },
  { id: 'EVT-004', name: 'Indie Night: Under the Stars', category: 'Âm nhạc', organizer: 'The Indie House', location: 'Nhà Văn hóa Thanh Niên', date: '20/10/2026 · 19:00', submittedAt: '2 giờ trước', tickets: 450, color: 'pink' },
];

