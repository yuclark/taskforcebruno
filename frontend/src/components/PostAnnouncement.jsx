import React, { useState } from 'react';

export default function PostAnnouncement({ session }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setStatusMsg('');
    setLoading(true);
    
    const uploadFormPayload = new FormData();
    uploadFormPayload.append('title', title.trim());
    uploadFormPayload.append('content', content.trim());
    uploadFormPayload.append('author_email', session?.email || 'mdc.staff@cit.edu');
    
    if (imageFile) {
      uploadFormPayload.append('image', imageFile);
    }

    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/announcements/', {
        method: 'POST',
        body: uploadFormPayload
      });
      
      if (res.ok) {
        setStatusMsg('Official bulletin broadcasted successfully to the community newsfeed!');
        setTitle('');
        setContent('');
        setImageFile(null);
        setImagePreview(null);
        if (e.target) e.target.reset(); 
      } else {
        setStatusMsg('Server rejected announcement payload structure.');
      }
    } catch (err) {
      console.error(err);
      setStatusMsg('Network connection failure with announcement server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in font-sans text-xs text-slate-700 pb-12">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
            Campus Broadcast Bulletin Composer
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Publish official announcements, rabies vaccination drives, feeding station updates, or adoption showcases to the campus newsfeed.
          </p>
        </div>
        <span className="bg-[#5C0612]/10 text-[#5C0612] border border-[#5C0612]/20 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 shrink-0">
          MDC Verified Broadcaster
        </span>
      </div>

      {statusMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-center font-semibold text-xs shadow-sm">
          {statusMsg}
        </div>
      )}

      {/* Main Two-Column Balanced Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: COMPOSER FORM (7 COLS) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm text-left">
          <form onSubmit={handlePublish} className="space-y-4">
            
            {/* Staff Authority Signature */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#5C0612] text-[#D4AF37] flex items-center justify-center font-bold text-xs shadow-sm shrink-0 border border-[#D4AF37]/30">
                MDC
              </div>
              <div>
                <p className="font-bold text-slate-900 text-xs">MDC Administrative Staff</p>
                <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{session?.email || 'mdc.staff@cit.edu'}</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                Announcement Headline Title *
              </label>
              <input 
                type="text" 
                required
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. Annual Campus Rabies Vaccination Drive Schedule Announced" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold text-slate-900 text-xs tracking-tight placeholder-slate-400 transition-all" 
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                Detailed Broadcast Content *
              </label>
              <textarea 
                required
                rows="7" 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Share the official guidelines, dates, locations, or reminders with students and faculty..." 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-slate-800 text-xs leading-relaxed placeholder-slate-400 resize-none transition-all"
              />
            </div>

            <div className="bg-slate-50 p-4 border border-dashed border-slate-200 rounded-2xl">
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Attach Graphic or Document Photo (Optional)
              </label>
              <input 
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
                <svg className="w-4 h-4 text-[#D4AF37]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
                {loading ? 'Publishing Bulletin...' : 'Broadcast to Community Newsfeed'}
              </button>
            </div>

          </form>
        </div>

        {/* RIGHT COLUMN: LIVE NEWSFEED POST PREVIEW (5 COLS - STICKY) */}
        <div className="lg:col-span-5 sticky top-6 space-y-4 text-left">
          <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
            Live Community Newsfeed Preview
          </span>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            {/* Post Author Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#5C0612] text-[#D4AF37] flex items-center justify-center font-bold text-xs shrink-0 border border-[#D4AF37]/30">
                  MDC
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 text-xs">MDC Administrative Staff</span>
                    <span className="bg-[#5C0612] text-white text-[8px] font-bold px-1.5 py-0.2 rounded font-mono uppercase">OFFICIAL</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">Just now</span>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight leading-snug">
                {title || 'Announcement Title Preview'}
              </h3>
              <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-line">
                {content || 'Your detailed broadcast description will display here as students and faculty see it on the community newsfeed.'}
              </p>
            </div>

            {/* Attached Photo Preview */}
            {imagePreview ? (
              <div className="w-full max-h-[320px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                <img src={imagePreview} alt="Preview Attachment" className="w-full h-auto max-h-[320px] object-cover animate-fade-in" />
              </div>
            ) : (
              <div className="w-full h-32 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 select-none font-mono text-[10px] uppercase font-bold">
                <svg className="w-6 h-6 mb-1 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
                </svg>
                Optional Graphic Attachment
              </div>
            )}

            {/* Mock Engagement Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-400 text-[11px] font-medium select-none">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
                0 Likes
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                </svg>
                0 Comments
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}