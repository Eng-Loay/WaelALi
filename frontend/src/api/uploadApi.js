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
    throw new Error(data.message || 'فشل رفع الملف');
  }
  return data.data.url;
}

export function fileLinkLabel(url) {
  if (!url) return '—';
  const name = url.split('/').pop();
  return name || url;
}
