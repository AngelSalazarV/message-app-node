export async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 401 || res.status === 403 || res.status === 404) {
    // Lanza un error especial para manejarlo globalmente
    throw { type: "FORCE_LOGOUT", status: res.status };
  }
  return res;
}