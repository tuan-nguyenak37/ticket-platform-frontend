export function vnd(value: string | number) { return `${new Intl.NumberFormat('vi-VN').format(BigInt(value))} ₫`; }
export function parseVnd(value: string) {
  if (!/^(0|[1-9]\d*)$/.test(value) || !Number.isSafeInteger(Number(value))) throw new Error('Giá phải là số nguyên VND an toàn.');
  return Number(value);
}
export function vnInput(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value)).replace(' ', 'T');
}
export function vnWire(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || (Number.isNaN(Date.parse(`${value}:00+07:00`)) || vnInput(`${value}:00+07:00`) !== value)) throw new Error('Thời gian Việt Nam không hợp lệ.');
  return `${value}:00+07:00`;
}


