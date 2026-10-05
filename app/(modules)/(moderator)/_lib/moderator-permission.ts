// Quyền hiển thị phía FE; backend vẫn phải kiểm tra quyền từng API.
export function hasModeratorPermission(role: string | null | undefined) {
  return role === 'moderator' || role === 'admin';
}
