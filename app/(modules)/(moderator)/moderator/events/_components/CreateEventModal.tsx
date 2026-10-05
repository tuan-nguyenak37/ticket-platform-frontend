'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Calendar,
  Clock,
  MapPin,
  Tag,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useCreateEventMutation } from '../_hooks/useEvents';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES = [
  { id: 'pm_evt_cat_01ffae0869c1', name: 'Concert & Âm nhạc' },
  { id: 'pm_evt_cat_02ffae0869c2', name: 'Hội thảo & Workshop' },
  { id: 'pm_evt_cat_03ffae0869c3', name: 'Thể thao & Giải đấu' },
  { id: 'pm_evt_cat_04ffae0869c4', name: 'Sân khấu & Nghệ thuật' },
  { id: 'pm_evt_cat_05ffae0869c5', name: 'Lễ hội & Triển lãm' },
];

export function CreateEventModal({ isOpen, onClose, onSuccess }: CreateEventModalProps) {
  const createMutation = useCreateEventMutation();

  // Form states
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);

  // Default dates: tomorrow 18:00 to 22:00
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultDateStr);
  const [startTime, setStartTime] = useState('18:00');
  const [endDate, setEndDate] = useState(defaultDateStr);
  const [endTime, setEndTime] = useState('22:00');

  // File uploads
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const thumbInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const url = URL.createObjectURL(file);
      setThumbnailPreview(url);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const url = URL.createObjectURL(file);
      setBannerPreview(url);
    }
  };

  const removeThumbnail = (e: React.MouseEvent) => {
    e.stopPropagation();
    setThumbnailFile(null);
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview(null);
    if (thumbInputRef.current) thumbInputRef.current.value = '';
  };

  const removeBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBannerFile(null);
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerPreview(null);
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  };

  const handleSubmit = async (targetStatus: 'draft' | 'published') => {
    setErrorMsg(null);

    // 1. Basic validation
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập tên sự kiện.');
      return;
    }
    if (!venueName.trim() || !address.trim()) {
      setErrorMsg('Vui lòng nhập tên địa điểm và địa chỉ chi tiết.');
      return;
    }
    if (!startDate || !startTime || !endDate || !endTime) {
      setErrorMsg('Vui lòng chọn thời gian bắt đầu và kết thúc.');
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}:00`);
    const endDateTime = new Date(`${endDate}T${endTime}:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      setErrorMsg('Định dạng thời gian không hợp lệ.');
      return;
    }

    if (endDateTime <= startDateTime) {
      setErrorMsg('Thời gian kết thúc phải diễn ra sau thời gian bắt đầu.');
      return;
    }

    // Kiểm tra ảnh đối với Backend API
    if (!thumbnailFile || !bannerFile) {
      setErrorMsg('Backend yêu cầu bắt buộc phải tải lên cả ảnh Thumbnail và Banner.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      if (shortDescription.trim()) formData.append('shortDescription', shortDescription.trim());
      if (description.trim()) formData.append('description', description.trim());
      formData.append('venueName', venueName.trim());
      formData.append('address', address.trim());
      formData.append('categoryId', categoryId);
      formData.append('status', targetStatus);
      formData.append('startTime', startDateTime.toISOString());
      formData.append('endTime', endDateTime.toISOString());
      formData.append('thumbnail', thumbnailFile);
      formData.append('banner', bannerFile);

      await createMutation.mutateAsync(formData);

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo sự kiện.';
      setErrorMsg(msg);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!createMutation.isPending) onClose();
        }}
      />

      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-2xl z-10 max-h-[90vh] flex flex-col text-slate-900 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Tạo sự kiện mới</h2>
              <p className="text-xs text-slate-500">
                Thêm sự kiện và phát hành trực tiếp qua API quản trị TicketVerse.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={createMutation.isPending}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 animate-in fade-in">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Thông tin cơ bản */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="size-3.5 text-violet-600" />
              1. Thông tin cơ bản
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên sự kiện <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Lễ hội Âm nhạc Mùa Hè 2026..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/10"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Danh mục <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 py-2.5 text-xs text-slate-800 focus:border-violet-500 focus:bg-white focus:outline-none cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mô tả ngắn gọn
                  </label>
                  <input
                    type="text"
                    placeholder="Điểm nhấn chính của sự kiện..."
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả chi tiết nội dung
                </label>
                <textarea
                  rows={3}
                  placeholder="Giới thiệu chương trình, dàn nghệ sĩ, lưu ý cho khán giả..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/10"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Địa điểm & Thời gian */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MapPin className="size-3.5 text-violet-600" />
              2. Địa điểm & Lịch trình
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên địa điểm / Nhà hát <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Trung tâm Hội nghị SECC"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa chỉ cụ thể <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Số nhà, tên đường, quận/huyện, TP..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/10"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
              {/* Bắt đầu */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                  <Calendar className="size-3 text-violet-500" />
                  Bắt đầu <span className="text-rose-500">*</span>
                </span>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                  />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-24 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Kết thúc */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                  <Clock className="size-3 text-rose-500" />
                  Kết thúc <span className="text-rose-500">*</span>
                </span>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                  />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-24 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Tải ảnh Thumbnail & Banner */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ImageIcon className="size-3.5 text-violet-600" />
              3. Hình ảnh sự kiện (Bắt buộc)
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Thumbnail upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ảnh đại diện (Thumbnail - Tỉ lệ 1:1) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  ref={thumbInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
                <div
                  onClick={() => thumbInputRef.current?.click()}
                  className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 text-center hover:border-violet-400 hover:bg-violet-50/20 cursor-pointer transition-all aspect-video sm:aspect-square overflow-hidden"
                >
                  {thumbnailPreview ? (
                    <div className="relative size-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="size-full object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={removeThumbnail}
                        className="absolute top-2 right-2 rounded-lg bg-slate-900/70 p-1 text-white hover:bg-rose-600 transition-colors"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="size-6 text-slate-400 mb-1.5" />
                      <p className="text-xs font-medium text-slate-700">Tải ảnh Thumbnail</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP tối đa 5MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* Banner upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ảnh bìa (Banner - Tỉ lệ 16:9) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  ref={bannerInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleBannerChange}
                  className="hidden"
                />
                <div
                  onClick={() => bannerInputRef.current?.click()}
                  className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 text-center hover:border-violet-400 hover:bg-violet-50/20 cursor-pointer transition-all aspect-video overflow-hidden"
                >
                  {bannerPreview ? (
                    <div className="relative size-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bannerPreview}
                        alt="Banner preview"
                        className="size-full object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={removeBanner}
                        className="absolute top-2 right-2 rounded-lg bg-slate-900/70 p-1 text-white hover:bg-rose-600 transition-colors"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="size-6 text-slate-400 mb-1.5" />
                      <p className="text-xs font-medium text-slate-700">Tải ảnh Banner</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Khuyên dùng 1920x1080px</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={createMutation.isPending}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Hủy bỏ
          </button>

          <div className="flex items-center gap-2">
            {/* Lưu bản nháp */}
            <button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => handleSubmit('draft')}
              className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-violet-700 border-t-transparent" />
              ) : null}
              <span>Lưu bản nháp (Draft)</span>
            </button>

            {/* Xuất bản ngay */}
            <button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => handleSubmit('published')}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-violet-200 hover:bg-violet-700 transition-all disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              <span>Tạo & Xuất bản ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
