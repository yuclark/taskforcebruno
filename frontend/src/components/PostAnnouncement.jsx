import { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, Heart, MessageCircle, X, Megaphone } from 'lucide-react';
import { apiPost } from '../lib/api';
import { getUserDisplayName, getUserInitials } from '../lib/auth';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function PostAnnouncement({ session }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const staffName = getUserDisplayName(session, 'MDC Staff');
  const staffInitials = getUserInitials(session, 'MD');

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMsg({ type: 'error', text: 'Please select a valid image file (JPG, PNG, WebP, or GIF).' });
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setStatusMsg({ type: 'error', text: 'Attached image must be 5 MB or smaller.' });
      e.target.value = '';
      return;
    }

    setStatusMsg({ type: '', text: '' });
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (loading || !title.trim() || !content.trim()) return;

    setStatusMsg({ type: '', text: '' });
    setLoading(true);

    const payload = new FormData();
    payload.append('title', title.trim());
    payload.append('content', content.trim());
    if (imageFile) {
      payload.append('image', imageFile);
    }

    try {
      const res = await apiPost('/announcements/', payload);
      if (res.ok) {
        setStatusMsg({
          type: 'success',
          text: 'Announcement published to the community newsfeed.',
        });
        setTitle('');
        setContent('');
        clearImage();
      } else {
        setStatusMsg({
          type: 'error',
          text: res.error || 'Unable to publish announcement. Please check your entries.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 sm:space-y-6 animate-fade-in font-sans text-xs text-slate-700 pb-8">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-left">
        <div>
          <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[#5C0612]" />
            Publish Campus Announcement
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Share vaccination drives, feeding station updates, and welfare bulletins on the community feed.
          </p>
        </div>
        <span className="bg-[#5C0612]/10 text-[#5C0612] border border-[#5C0612]/20 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 shrink-0">
          Official MDC Notice
        </span>
      </div>

      {statusMsg.text && (
        <div
          className={`p-3.5 border rounded-2xl text-center font-semibold text-xs shadow-sm ${
            statusMsg.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left Column: Composer */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm text-left">
          <form onSubmit={handlePublish} className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#5C0612] text-[#D4AF37] flex items-center justify-center font-bold text-xs shadow-sm shrink-0 border border-[#D4AF37]/30">
                {staffInitials}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-xs truncate">{staffName}</p>
                <span className="text-[11px] text-slate-400 font-mono block mt-0.5 truncate">
                  {session?.email || 'CIT-U MDC Staff'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                Announcement Headline *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual Campus Rabies Vaccination Drive Schedule"
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C0612]/15 font-bold text-slate-900 text-base sm:text-xs placeholder-slate-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                Announcement Body *
              </label>
              <textarea
                required
                rows="7"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share dates, locations, guidelines, or reminders for students and faculty..."
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C0612]/15 text-slate-800 text-base sm:text-xs leading-relaxed placeholder-slate-400 resize-none transition-all"
              />
            </div>

            <div className="bg-slate-50 p-4 border border-dashed border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Attach Photo or Poster (Optional, Max 5 MB)
                </label>
                {imageFile && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:text-rose-800"
                  >
                    <X className="w-3 h-3" />
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-slate-500 font-mono text-[11px] file:mr-3 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-mono file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 file:cursor-pointer"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#5C0612] hover:bg-[#42040B] text-white font-bold tracking-wider rounded-xl border-b-4 border-[#D4AF37] active:scale-[0.99] uppercase transition-all shadow-md text-xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4 text-[#D4AF37]" />
                {loading ? 'Publishing...' : 'Publish to Community Feed'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-3 text-left">
          <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
            Live Newsfeed Preview
          </span>

          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#5C0612] text-[#D4AF37] flex items-center justify-center font-bold text-xs shrink-0 border border-[#D4AF37]/30">
                  {staffInitials}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-900 text-xs">{staffName}</span>
                    <span className="bg-[#5C0612] text-white text-[8px] font-bold px-1.5 py-0.5 rounded font-mono uppercase">
                      OFFICIAL
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">Just now</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight leading-snug">
                {title || 'Announcement Headline Preview'}
              </h3>
              <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-line">
                {content ||
                  'Your announcement text will appear here exactly as students and staff see it in the feed.'}
              </p>
            </div>

            {imagePreview ? (
              <div className="w-full max-h-[320px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                <img
                  src={imagePreview}
                  alt="Attachment preview"
                  className="w-full h-auto max-h-[320px] object-cover animate-fade-in"
                />
              </div>
            ) : (
              <div className="w-full h-28 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 select-none font-mono text-[10px] uppercase font-bold">
                <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                Optional Photo Attachment
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-400 text-[11px] font-medium select-none">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-slate-400" />0 Likes
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4 text-slate-400" />0 Comments
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
