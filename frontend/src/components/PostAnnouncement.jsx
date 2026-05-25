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
      setImagePreview(URL.createObjectURL(file)); // Generate instantaneous hot visual feedback link
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
        setStatusMsg('Bulletin successfully broad-casted to community newsfeed streams!');
        setTitle('');
        setContent('');
        setImageFile(null);
        setImagePreview(null);
        if (e.target) e.target.reset(); 
      } else {
        setStatusMsg('Server rejected announcement compilation payload structure.');
      }
    } catch (err) {
      console.error(err);
      setStatusMsg('Ecosystem pipeline connection timeout exception.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* STRETCHED CARD BODY CONTAINER: Max-width is blown wide open to cleanly fill the dashboard viewport */
    <div className="w-full max-w-5xl bg-white border border-slate-200 shadow-xl rounded-3xl overflow-hidden mx-auto animate-fade-in font-sans text-xs text-slate-700">
      
      {/* Header Banner */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="font-black text-slate-900 text-sm tracking-tight">Create Global Broadcast Announcement</h3>
          <p className="text-[10px] text-slate-400 mt-0.5 font-normal">Transmit official system status alerts and rehoming highlights to community nodes.</p>
        </div>
        <span className="bg-[#5C0612]/10 text-[#5C0612] border border-[#5C0612]/20 rounded-xl font-mono text-[9px] font-black uppercase tracking-wider px-3 py-1">MDC Broadcaster</span>
      </div>

      <div className="p-6">
        {statusMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-center font-medium shadow-sm mb-4">
            {statusMsg}
          </div>
        )}

        <form onSubmit={handlePublish} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT INPUT COLUMN BLOCK */}
          <div className="lg:col-span-7 space-y-4 text-left">
            {/* Staff Context Row */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#5C0612] text-white flex items-center justify-center font-bold text-xs select-none shadow-sm">
                MDC
              </div>
              <div>
                <p className="font-bold text-slate-900 RegalHeader text-[12px] leading-none">MDC Administrative Authority</p>
                <span className="text-[10px] text-slate-400 mt-1 block font-mono">{session?.email || 'admin.portal@cit.edu'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Bulletin Header Title *</label>
                <input 
                  type="text" 
                  required
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Enter bulletin title header..." 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-slate-300 font-bold text-slate-900 text-xs tracking-tight placeholder-slate-400 transition-all" 
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Detailed Broadcast Content Copy *</label>
                <textarea 
                  required
                  rows="6" 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  placeholder="What update do you want to broadcast to the campus community today?" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-slate-300 text-slate-800 text-xs leading-relaxed placeholder-slate-400 resize-none transition-all"
                ></textarea>
              </div>

              <div className="bg-slate-50 p-4 border border-dashed border-slate-200 rounded-xl">
                <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Add Gallery Image File (Optional Placement)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-slate-500 font-mono text-[11px] file:mr-3 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-mono file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 file:cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* RIGHT LIVE COMPOSER PREVIEW INTERACTIVE WINDOW */}
          <div className="lg:col-span-5 h-full flex flex-col">
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider text-left mb-1">Live Asset Matrix Preview</label>
            <div className="border border-slate-200 bg-slate-50/50 rounded-2xl p-4 flex-1 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
              {imagePreview ? (
                <div className="w-full h-full min-h-[200px] max-h-[280px] rounded-xl overflow-hidden border shadow-sm bg-white">
                  <img src={imagePreview} alt="Preview attachment" className="w-full h-full object-cover animate-fade-in" />
                </div>
              ) : (
                <div className="text-center space-y-1 text-slate-400">
                  <svg className="w-8 h-8 mx-auto opacity-40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 .375 0 11-.75 0 .375 .375 0 01.75 0z" />
                  </svg>
                  <p className="font-mono text-[9px] uppercase tracking-wider font-bold">No Image Attached</p>
                  <p className="text-[10px] px-4 font-normal">Select an optional graphic file asset on the left pane to check aspect boundaries.</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Trigger Button Anchor */}
          <div className="lg:col-span-12 pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-[#5C0612] text-white font-bold tracking-widest rounded-xl border-b-4 border-[#D4AF37] hover:bg-[#42040B] active:scale-[0.99] uppercase transition-all shadow-md text-xs disabled:opacity-50"
            >
              {loading ? 'PUBLISHING BROADCAST BULLETIN...' : 'Share to Newsfeed'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}