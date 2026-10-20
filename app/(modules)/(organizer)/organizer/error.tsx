'use client';
export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) { return <section className="commerce-light min-h-screen bg-slate-50 p-6"><div className="tv-panel space-y-4" role="alert"><h2>Không thể hiển thị trang Ban tổ chức</h2><button className="tv-button" onClick={retry}>Thử lại</button></div></section>; }
