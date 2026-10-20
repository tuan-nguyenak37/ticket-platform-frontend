const labels: Record<string, string> = { DRAFT: 'Bản nháp', ACTIVE: 'Đang hoạt động', INACTIVE: 'Ngừng hoạt động', SUSPENDED: 'Bị đình chỉ', PUBLISHED: 'Đã công bố', PENDING_REVIEW: 'Chờ duyệt', REJECTED: 'Cần chỉnh sửa' };

export function OrganizerStatus({ status }: { status: string }) {
  return <span className="org-status" data-status={status}><span aria-hidden="true" />{labels[status] ?? status}</span>;
}
