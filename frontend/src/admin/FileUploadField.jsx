import { useMemo } from 'react';
import { fileLinkLabel } from '../api/uploadApi';

export default function FileUploadField({
  label,
  accept,
  uploadKind = 'image',
  value,
  file,
  onFileChange,
  required,
}) {
  const preview = useMemo(() => {
    if (file && uploadKind === 'image') return URL.createObjectURL(file);
    if (value && uploadKind === 'image') return value;
    return null;
  }, [file, value, uploadKind]);

  const fileName = file?.name || (value ? fileLinkLabel(value) : '');

  return (
    <label className="dash-upload-field admin-form-full">
      <span>{label}</span>
      <div className="dash-upload-box">
        <input
          type="file"
          accept={accept}
          required={required && !value}
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
        />
        {preview ? (
          <img src={preview} alt="" className="dash-upload-preview" />
        ) : (
          <div className="dash-upload-placeholder">
            <strong>اختر ملف للرفع</strong>
            <span>
              {uploadKind === 'image' && 'صورة: JPG, PNG, WEBP'}
              {uploadKind === 'video' && 'فيديو: MP4, WEBM'}
              {uploadKind === 'audio' && 'ريكورد: صوت أو فيديو'}
              {uploadKind === 'pdf' && 'PDF فقط'}
            </span>
          </div>
        )}
        {fileName && <p className="dash-upload-name">{fileName}</p>}
      </div>
    </label>
  );
}
