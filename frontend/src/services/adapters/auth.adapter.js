/**
 * Normalizes auth-related responses.
 */

export function adaptSession(raw) {
  return {
    userid:   raw.userid   ?? raw.user_id ?? null,
    roleid:   raw.roleid   ?? raw.role_id ?? null,
    username: raw.username ?? null,
  };
}
