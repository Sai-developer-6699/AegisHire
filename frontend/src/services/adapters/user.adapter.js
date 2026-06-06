/**
 * Normalizes user-related responses from the backend.
 */

export function adaptUser(raw) {
  if (!raw) return null;

  const firstName = raw.first_name ?? '';
  const lastName = raw.last_name ?? '';
  const fullName = raw.name ?? `${firstName} ${lastName}`.trim() ?? 'Unknown User';

  return {
    id:          raw.id ?? raw.userid ?? null,
    firstName:   raw.first_name ?? '',
    lastName:    raw.last_name ?? '',
    fullName,
    username:    raw.username ?? '',
    email:       raw.email ?? null,
    phone:       raw.phone_number ?? raw.phone ?? null,
    status:      raw.status ?? 'active',
    department:  raw.department ?? null,
    role:        raw.role ?? null,
    initials:    raw.initials ?? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    color:       raw.color ?? 'text-green-400',
  };
}

export function adaptUserList(rawList) {
  return (rawList ?? []).map(adaptUser);
}
