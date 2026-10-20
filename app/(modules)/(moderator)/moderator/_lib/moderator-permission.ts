export function hasModeratorPermission(role: string | null | undefined): boolean {
  return role === 'MODERATOR';
}
