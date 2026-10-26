export function vnd(value: string | number) { return `${new Intl.NumberFormat('vi-VN').format(BigInt(value))} ₫`; }
export function parseVnd(value: string) {
  if (!/^(0|[1-9]\d*|[1-9]\d{0,2}(?:\.\d{3})+)$/.test(value)) throw new Error('Nhập giá VND nguyên không âm, ví dụ 230000 hoặc 230.000.');
  const amount = Number(value.replace(/\./g, ''));
  if (!Number.isSafeInteger(amount)) throw new Error('Giá vượt giới hạn số nguyên VND an toàn.');
  return amount;
}
export function vnInput(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value)).replace(' ', 'T');
}
export function vnWire(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || (Number.isNaN(Date.parse(`${value}:00+07:00`)) || vnInput(`${value}:00+07:00`) !== value)) throw new Error('Thời gian Việt Nam không hợp lệ.');
  return `${value}:00+07:00`;
}


