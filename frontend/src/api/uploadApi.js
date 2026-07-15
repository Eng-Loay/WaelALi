export async function uploadAdminFile(file, kind = 'image') {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('admin_token');
  const res = await fetch(`/api/admin/upload/${kind}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      const path = window.location.pathname || '';
      if (!path.includes('/login')) {
        window.location.assign('/login');
      }
    }
    throw new Error(data.message || 'فشل رفع الملف');
  }
  return data.data.url;
}

export function fileLinkLabel(url) {
  if (!url) return '—';
  const name = url.split('/').pop();
  return name || url;
}
