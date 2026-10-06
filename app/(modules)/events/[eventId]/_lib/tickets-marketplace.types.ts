export type TicketType = 'eticket' | 'physical';

export interface SellerInfo {
  id: string;
  name: string;
  avatar?: string;
  reputationScore: number; // Điểm uy tín từ 1.0 -> 5.0
  successfulSales: number; // Số đơn pass thành công
  isIdentityVerified: boolean; // Đã xác minh CCCD
  joinDate?: string;
}

export interface TicketListing {
  id: string;
  eventId: string;
  tierName: string; // VIP 1, VIP 2, CAT 1, CAT 2, Stand A, GA
  tierColor?: string; // violet, emerald, amber, blue, rose
  zone: string; // Khán đài A, Cửa 4, Tầng 2
  seatNumber?: string; // Hàng D, Ghế 14-15 hoặc Đứng tự do
  quantity: number; // Số lượng vé pass
  isAdjacentSeats: boolean; // Ghế liền kề
  originalPrice: number; // Giá gốc ban đầu (VND)
  resalePrice: number; // Giá pass lại (VND)
  ticketType: TicketType; // Vé điện tử (QR) hoặc Vé cứng
  seller: SellerInfo;
  note?: string; // Ghi chú người bán
  createdAt: string;
}

export interface TicketFilterState {
  query: string;
  tier: string;
  priceRange: string;
  quantity: string;
  sortBy: 'price_asc' | 'price_desc' | 'newest' | 'reputation';
}
