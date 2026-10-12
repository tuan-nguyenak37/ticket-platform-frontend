import Link from 'next/link';

const sections = [
  { href: '/moderator/events', title: 'Quản lý sự kiện', description: 'Xem, cập nhật và quản lý sự kiện từ hệ thống.' },
  { href: '/moderator/tickets', title: 'Duyệt vé', description: 'Kiểm tra PDF, đối chiếu OCR và xử lý vé cần duyệt.' },
  { href: '/moderator/orders', title: 'Quản lý đơn hàng', description: 'Theo dõi giao dịch và xử lý tranh chấp.' },
];

export function ModeratorDashboard() {
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Tổng quan kiểm duyệt</h1><p className="mt-2 text-sm text-slate-500">Truy cập các chức năng quản lý dữ liệu trên hệ thống.</p></div>
    <div className="grid gap-4 md:grid-cols-3">{sections.map(section => <Link key={section.href} href={section.href} className="rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-violet-400 focus-visible:outline-2 focus-visible:outline-violet-600"><h2 className="font-semibold">{section.title}</h2><p className="mt-2 text-sm text-slate-500">{section.description}</p></Link>)}</div>
    <p className="text-sm text-slate-500">Thống kê tổng hợp, lịch sử hoạt động và check-in chưa có API hỗ trợ.</p>
  </div>;
}
