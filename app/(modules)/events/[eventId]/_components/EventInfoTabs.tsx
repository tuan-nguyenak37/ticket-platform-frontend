import type { PublicEvent } from '@/lib/events/events.types';
export function EventInfoTabs({ event }: { event: PublicEvent }) {
  return <section className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8"><h2 className="text-lg font-bold">Thông tin sự kiện</h2><p className="whitespace-pre-wrap text-sm text-white/80">{event.description || 'Chưa có mô tả cho sự kiện này.'}</p><details><summary className="cursor-pointer font-semibold">Quy trình mua và hỗ trợ</summary><div className="mt-4 space-y-3 text-sm text-white/75"><p>Giữ bảo mật file và mã vé của bạn, không chia sẻ công khai.</p><p>Nếu gặp vấn đề với vé, bạn có thể gửi yêu cầu hỗ trợ tại chi tiết đơn hàng trong thời hạn tranh chấp.</p></div></details></section>;
}
