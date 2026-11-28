import { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  Building2,
  Camera,
  CheckCircle2,
  FileText,
  IdCard,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import UserAvatar from './UserAvatar';
import { apiGet, apiPut } from '../lib/api';
import {
  PHONE_PATTERN,
  getUserDisplayName,
  getUserInitials,
  isStaffSession,
} from '../lib/auth';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function buildInitialForm(user) {
  return {
    first_name: (user?.first_name || '').trim(),
    last_name: (user?.last_name || '').trim(),
    contact_number: (user?.contact_number || '').trim(),
    department: (user?.department || '').trim(),
    bio: (user?.bio || '').trim(),
  };
}

function ProfileSettingsDialog({ onClose, session, onProfileUpdated }) {
  const [form, setForm] = useState(() => buildInitialForm(session));
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(() => session?.avatar_url || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef(null);
  const savingRef = useRef(false);
  const isStaff = isStaffSession(session);

  useEffect(() => {
    savingRef.current = saving;
  }, [saving]);

  // Fetch freshest server profile on mount & lock background scroll
  useEffect(() => {
    const controller = new AbortController();
    const loadProfile = async () => {
      const res = await apiGet('/profile/', { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (res.ok && res.data?.user) {
        const u = res.data.user;
        setForm(buildInitialForm(u));
        setCurrentAvatarUrl(u.avatar_url || '');
      }
      setLoadingProfile(false);
    };
    loadProfile();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !savingRef.current) onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      controller.abort();
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  // Revoke local object URL when replaced or unmounted
  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const activeAvatarSrc = removeAvatar ? '' : previewUrl || currentAvatarUrl;
  const previewSession = {
    ...session,
    first_name: form.first_name || session?.first_name,
    last_name: form.last_name || session?.last_name,
    full_name: `${form.first_name || ''} ${form.last_name || ''}`.trim() || session?.full_name,
  };
  const liveDisplayName = getUserDisplayName(previewSession, isStaff ? 'MDC Staff' : 'Community Member');
  const liveInitials = getUserInitials(previewSession, isStaff ? 'MS' : 'CM');
  const lockedId = session?.custom_id || session?.student_id || 'Not assigned';
  const lockedEmail = session?.email || '';
  const lockedRoleLabel = isStaff ? 'MDC Staff (Verified Personnel)' : 'Student / Community Member';

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (successMsg) setSuccessMsg('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccessMsg('');

    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      setError('Please choose a valid JPG, PNG, WebP, or GIF image.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError('Profile picture must be 5 MB or smaller.');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRemoveAvatar(false);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setRemoveAvatar(true);
    setError('');
    setSuccessMsg('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setError('');
    setSuccessMsg('');

    const firstClean = form.first_name.trim();
    const lastClean = form.last_name.trim();
    const phoneClean = form.contact_number.trim();
    const deptClean = form.department.trim();
    const bioClean = form.bio.trim();

    if (!firstClean || !lastClean) {
      setError('Both first name and last name are required.');
      return;
    }

    if (phoneClean) {
      const normalizedPhone = phoneClean.replace(/[\s-]+/g, '');
      if (!PHONE_PATTERN.test(normalizedPhone)) {
        setError('Please enter a valid Philippine mobile or landline number (e.g., 09171234567).');
        return;
      }
    }

    const payload = new FormData();
    payload.append('first_name', firstClean);
    payload.append('last_name', lastClean);
    payload.append('contact_number', phoneClean);
    payload.append('department', deptClean);
    payload.append('bio', bioClean);

    if (selectedFile) {
      payload.append('avatar', selectedFile);
    } else if (removeAvatar) {
      payload.append('remove_avatar', 'true');
    }

    setSaving(true);
    const res = await apiPut('/profile/', payload);
    setSaving(false);

    if (res.ok && res.data?.user) {
      const updatedUser = res.data.user;
      setCurrentAvatarUrl(updatedUser.avatar_url || '');
      setSelectedFile(null);
      setPreviewUrl('');
      setRemoveAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (onProfileUpdated) {
        onProfileUpdated(updatedUser);
      }
      setSuccessMsg('Profile changes saved!');
      setTimeout(() => {
        onClose();
      }, 650);
    } else {
      setError(res.error || 'Unable to save your profile right now. Please try again.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-settings-title"
      onClick={() => !saving && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92dvh] text-left animate-scale-up"
      >
        {/* Maroon Institutional Header */}
        <div className="bg-[#5C0612] dark:bg-[#1B1416] px-5 sm:px-6 py-4 border-b-2 border-[#D4AF37] dark:border-b dark:border-zinc-800 flex items-center justify-between gap-3 text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37] block">
                {isStaff ? 'MDC Staff Account' : 'CIT-U Community Account'}
              </span>
              <h2
                id="profile-settings-title"
                className="text-base sm:text-lg font-bold tracking-tight text-white truncate"
              >
                Edit Profile &amp; Photo
              </h2>
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            aria-label="Close profile settings"
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 flex items-center justify-center text-stone-200 hover:text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-medium flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div
                role="status"
                className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Profile Picture Upload Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative shrink-0">
                <UserAvatar
                  src={activeAvatarSrc}
                  initials={liveInitials}
                  name={liveDisplayName}
                  size="xl"
                  roundedClass="rounded-2xl"
                  className="ring-2 ring-[#D4AF37]/70 shadow-md"
                />
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Choose profile picture"
                  className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-[#5C0612] hover:bg-[#42040B] text-white border-2 border-white shadow-md flex items-center justify-center transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left min-w-0 space-y-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 truncate">{liveDisplayName}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    JPG, PNG, WebP, or GIF up to 5 MB. Shown in your portal header and community discussions.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Upload profile picture"
                />

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-xs shadow-xs transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#5C0612]" />
                    <span>{activeAvatarSrc ? 'Change Photo' : 'Upload Photo'}</span>
                  </button>

                  {activeAvatarSrc && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold text-xs transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Editable Personal Information */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#5C0612]">
                  Editable Personal Information
                </h3>
                {loadingProfile && (
                  <span className="text-[10px] text-slate-400 font-medium">Syncing...</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="profile-first-name"
                    className="block text-[11px] font-semibold text-slate-700 mb-1"
                  >
                    First Name *
                  </label>
                  <input
                    id="profile-first-name"
                    type="text"
                    name="first_name"
                    required
                    maxLength={80}
                    disabled={saving}
                    value={form.first_name}
                    onChange={handleFieldChange}
                    placeholder="Juan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C0612]/25 focus:border-[#5C0612] text-base sm:text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-last-name"
                    className="block text-[11px] font-semibold text-slate-700 mb-1"
                  >
                    Last Name *
                  </label>
                  <input
                    id="profile-last-name"
                    type="text"
                    name="last_name"
                    required
                    maxLength={80}
                    disabled={saving}
                    value={form.last_name}
                    onChange={handleFieldChange}
                    placeholder="Dela Cruz"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C0612]/25 focus:border-[#5C0612] text-base sm:text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="profile-contact"
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 mb-1"
                  >
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>Contact Number</span>
                  </label>
                  <input
                    id="profile-contact"
                    type="tel"
                    name="contact_number"
                    maxLength={30}
                    disabled={saving}
                    value={form.contact_number}
                    onChange={handleFieldChange}
                    placeholder="09171234567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C0612]/25 focus:border-[#5C0612] font-mono text-base sm:text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-department"
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 mb-1"
                  >
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span>{isStaff ? 'Office / Clinic Unit' : 'Department / Program'}</span>
                  </label>
                  <input
                    id="profile-department"
                    type="text"
                    name="department"
                    maxLength={120}
                    disabled={saving}
                    value={form.department}
                    onChange={handleFieldChange}
                    placeholder={isStaff ? 'e.g. Medical-Dental Clinic' : 'e.g. BSIT / CCS'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C0612]/25 focus:border-[#5C0612] text-base sm:text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="profile-bio"
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700"
                  >
                    <FileText className="w-3 h-3 text-slate-400" />
                    <span>Short Bio</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {form.bio.length} / 240
                  </span>
                </div>
                <textarea
                  id="profile-bio"
                  name="bio"
                  rows={2}
                  maxLength={240}
                  disabled={saving}
                  value={form.bio}
                  onChange={handleFieldChange}
                  placeholder={
                    isStaff
                      ? 'e.g. Campus clinic nurse assisting with TNR & vaccinations.'
                      : 'e.g. Campus animal supporter near GLE and Canteen.'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C0612]/25 focus:border-[#5C0612] text-base sm:text-xs text-slate-900 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Locked / Protected Important Credentials */}
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-[#111113] border border-amber-200/80 dark:border-[#26262A] space-y-3">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-700 dark:text-[#DFBE6F] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-zinc-200">
                    Protected Institutional Credentials (Locked)
                  </h3>
                  <p className="text-[11px] text-amber-800 dark:text-zinc-400 mt-0.5 leading-snug">
                    Important account records verified by CIT-U cannot be edited here. Contact the MDC administrator if a correction is needed.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80">
                  <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    Institutional Email
                    <Lock className="w-2.5 h-2.5 ml-auto text-slate-400" />
                  </span>
                  <input
                    type="email"
                    readOnly
                    disabled
                    aria-label="Institutional Email (Locked)"
                    value={lockedEmail}
                    className="w-full bg-transparent text-xs font-semibold text-slate-700 mt-1 cursor-not-allowed focus:outline-none truncate"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80">
                  <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                    <IdCard className="w-3 h-3 text-slate-400" />
                    {isStaff ? 'Employee ID' : 'Student / Employee ID'}
                    <Lock className="w-2.5 h-2.5 ml-auto text-slate-400" />
                  </span>
                  <input
                    type="text"
                    readOnly
                    disabled
                    aria-label="Student or Employee ID (Locked)"
                    value={lockedId}
                    className="w-full bg-transparent font-mono text-xs font-bold text-slate-700 mt-1 cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {isStaff ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold text-slate-500 block">
                      Account Clearance &amp; Role
                    </span>
                    <span className="text-xs font-bold text-slate-800 block truncate">
                      {lockedRoleLabel}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-500 shrink-0">
                  <Lock className="w-2.5 h-2.5" />
                  Read-Only
                </span>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="bg-slate-50 px-5 sm:px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#5C0612] hover:bg-[#42040B] dark:bg-[#7A1121] dark:hover:bg-[#8E1628] disabled:opacity-60 text-white rounded-xl text-xs font-semibold border-b-2 border-[#D4AF37] dark:border-b-0 dark:ring-1 dark:ring-white/10 shadow-sm transition-colors inline-flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfileSettingsModal({
  isOpen,
  onClose,
  session,
  onProfileUpdated,
}) {
  if (!isOpen) return null;
  return (
    <ProfileSettingsDialog
      onClose={onClose}
      session={session}
      onProfileUpdated={onProfileUpdated}
    />
  );
}
