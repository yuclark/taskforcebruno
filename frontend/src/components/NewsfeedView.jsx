import React, { useState, useEffect } from 'react';

export default function NewsfeedView({ session }) {
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentInputs, setCommentInputs] = useState({});
  const [lightboxImg, setLightboxImg] = useState(null);

  const [editingItemId, setEditingItemId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [moderationError, setModerationError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedComments, setExpandedComments] = useState({});

  const [activeCommentDropdownId, setActiveCommentDropdownId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [commentToDelete, setCommentToDelete] = useState(null);

  const currentUserEmail = (session?.email || '').trim().toLowerCase();
  const currentUserRole = (session?.role || 'user').trim().toLowerCase();

  const isStaffClearance =
    currentUserRole === 'staff' ||
    currentUserEmail.includes('staff') ||
    currentUserEmail.includes('test');

  const safeJson = async (res) => {
    try {
      return await res.json();
    } catch {
      return {};
    }
  };

  const clearTransientUi = () => {
    setActiveDropdownId(null);
    setModerationError('');
    setItemToDelete(null);
    setEditingItemId(null);
    setEditTitle('');
    setEditBody('');
  };

  const [petsData, setPetsData] = useState([]);

  const fetchPetsData = async () => {
    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/pets/');
      if (res.ok) {
        const data = await res.json();
        setPetsData(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching pets for newsfeed telemetry:', err);
    }
  };

  const fetchStreamData = async () => {
    if (!currentUserEmail) return;
    try {
      const res = await fetch(
        `https://taskforcebruno.onrender.com/api/newsfeed/?email=${encodeURIComponent(currentUserEmail)}`
      );
      if (res.ok) {
        const data = await res.json();
        setFeedItems(data);
      } else {
        setFeedItems([]);
      }
    } catch (err) {
      console.error('Error fetching stream:', err);
      setFeedItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    clearTransientUi();
    setExpandedComments({});
    fetchStreamData();
    fetchPetsData();
  }, [currentUserEmail, currentUserRole]);

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdownId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleLikeToggle = async (feedId) => {
    setFeedItems(prev =>
      prev.map(item => {
        if (item.feed_id === feedId) {
          return {
            ...item,
            is_liked_by_me: !item.is_liked_by_me,
            likes_count: item.is_liked_by_me ? item.likes_count - 1 : item.likes_count + 1
          };
        }
        return item;
      })
    );

    try {
      await fetch('https://taskforcebruno.onrender.com/api/newsfeed/like/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feed_id: feedId, user_email: currentUserEmail })
      });
    } catch (err) {
      console.error('Like tracking sync down:', err);
    }
  };

  const handleSendComment = async (e, feedId) => {
    e.preventDefault();
    const text = (commentInputs[feedId] || '').trim();
    if (!text) return;

    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/newsfeed/comment/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feed_id: feedId,
          user_email: currentUserEmail,
          comment_text: text
        })
      });

      const data = await safeJson(res);
      if (res.ok) {
        setCommentInputs(prev => ({ ...prev, [feedId]: '' }));
        await fetchStreamData();
      } else {
        setModerationError(data.error || 'Failed to add comment.');
      }
    } catch (err) {
      setModerationError('Network error while adding comment.');
    }
  };

  const handleExecuteDelete = async () => {
    if (!itemToDelete) return;

    try {
      const res = await fetch(
        `https://taskforcebruno.onrender.com/api/newsfeed/action/?feed_id=${encodeURIComponent(itemToDelete)}`,
        { method: 'DELETE' }
      );
      const data = await safeJson(res);

      if (res.ok) {
        setItemToDelete(null);
        await fetchStreamData();
      } else {
        setModerationError(data.error || 'Delete failed.');
      }
    } catch (err) {
      setModerationError('Network error during delete.');
    }
  };

  const handleSaveEditChanges = async (feedId) => {
    try {
      const res = await fetch('https://taskforcebruno.onrender.com/api/newsfeed/action/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feed_id: feedId,
          title: editTitle.trim(),
          body: editBody.trim(),
        }),
      });
      const data = await safeJson(res);

      if (res.ok) {
        setEditingItemId(null);
        setEditTitle('');
        setEditBody('');
        await fetchStreamData();
      } else {
        setModerationError(data.error || 'Edit failed.');
      }
    } catch (err) {
      setModerationError('Network error during edit.');
    }
  };

  const startEditingWorkflow = (item) => {
    setModerationError('');
    setEditingItemId(item.feed_id);
    setEditTitle(item.title || '');
    setEditBody(item.body || '');
  };

  const toggleCommentsDrawer = (feedId) => {
    setExpandedComments(prev => ({
      ...prev,
      [feedId]: !prev[feedId]
    }));
  };

  if (loading) {
    return (
      <div className="w-full text-center p-12 font-mono text-xs text-slate-400 animate-pulse">
        Loading community announcements and sightings...
      </div>
    );
  }

  const totalCampusPetsCount = petsData.length > 0 
    ? petsData.length 
    : feedItems.filter(i => i.item_type === 'pet').length;

  const petsAwaitingHomeCount = petsData.length > 0
    ? petsData.filter(p => 
        (p.pet_type === 'For Adoption' || p.pet_id?.startsWith('STRAY-')) && 
        p.adoption_status === 'Available'
      ).length
    : feedItems.filter(i => i.item_type === 'pet' && (i.badge_text === 'Available' || i.badge_text === 'For Adoption')).length;

  const sightingsCount = feedItems.filter(i => i.item_type === 'sighting').length;

  const filteredFeedItems = feedItems.filter(item => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      item.title?.toLowerCase().includes(query) ||
      item.body?.toLowerCase().includes(query) ||
      item.author_tag?.toLowerCase().includes(query) ||
      item.badge_text?.toLowerCase().includes(query)
    );
  });

  const ITEMS_PER_PAGE = 5;
  const totalPagesCount = Math.ceil(filteredFeedItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedFeedItems = filteredFeedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl mx-auto px-1 sm:px-4 font-sans antialiased h-full flex flex-col overflow-hidden">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none !important; }
        .no-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      `}</style>

      {moderationError && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-900 font-medium text-center rounded-xl animate-fade-in relative flex items-center justify-between z-50 shrink-0">
          <span className="flex-1 truncate text-xs sm:text-sm">{moderationError}</span>
          <button onClick={() => setModerationError('')} className="text-rose-400 hover:text-rose-700 font-mono font-bold text-xs ml-2 px-1">✕</button>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0 items-stretch">
        
        {/* LEFT COLUMN: NEWSFEED POSTS STREAM (Col 8 on wide screens) */}
        <div className="lg:col-span-7 xl:col-span-8 w-full h-full flex flex-col min-h-0 bg-transparent">
          
          {/* Quick Metrics Bar */}
          <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-sm select-none shrink-0 mb-3">
            <span className="text-xs font-semibold text-slate-700 truncate">
              {totalCampusPetsCount} registered pets on campus &bull; {petsAwaitingHomeCount} awaiting adoption
            </span>
            <span className="text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
              Live Feed
            </span>
          </div>

          {/* Search Input Bar (No emoji) */}
          <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2.5 shrink-0 mb-3">
            <div className="text-slate-400 pl-2 select-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter announcements, sightings, and bulletins by keyword..."
              className="w-full bg-transparent text-xs text-slate-800 focus:outline-none placeholder-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="text-slate-400 hover:text-slate-600 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 rounded-md transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Feed Posts Scrollable List */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar min-h-0 pb-4">
            {paginatedFeedItems.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
                No announcements or sighting reports match your search query.
              </div>
            ) : (
              paginatedFeedItems.map((item) => {
                const initials = item.author_tag ? item.author_tag.substring(0, 2).toUpperCase() : 'CU';
                const HongKongDate = new Date(item.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                const isAnnouncement = item.item_type === 'announcement';
                const isSystemAutomatedFeed = item.item_type === 'sighting' || item.item_type === 'pet' || item.author_tag === 'mdc.operations@cit.edu';
                const isCurrentlyEditingThisItem = editingItemId === item.feed_id;
                const isCommentsOpen = !!expandedComments[item.feed_id];

                return (
                  <div key={item.feed_id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-left w-full animate-fade-in">
                    
                    {/* Post Author / Header */}
                    <div className="p-4 flex items-start justify-between border-b border-slate-100 gap-3 relative">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs select-none shadow-sm text-white shrink-0 ${
                          isAnnouncement ? 'bg-[#5C0612] text-[#D4AF37]' : 'bg-slate-700'
                        }`}>
                          {initials}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap max-w-full">
                            {!isCurrentlyEditingThisItem ? (
                              <h4 className="font-bold text-slate-900 text-sm tracking-tight leading-tight break-words pr-1">
                                {item.title}
                              </h4>
                            ) : (
                              <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold uppercase">
                                Modifying Post
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border shrink-0 ${
                              isAnnouncement ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                              {item.badge_text}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-normal mt-0.5 flex-wrap min-w-0">
                            <span className="truncate max-w-[140px] sm:max-w-[200px] font-medium text-slate-600">{item.author_tag}</span>
                            <span>&bull;</span>
                            <span className="shrink-0">{HongKongDate}</span>
                          </div>
                        </div>
                      </div>

                      {isStaffClearance && !isCurrentlyEditingThisItem && (
                        <div className="shrink-0 relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setActiveDropdownId(activeDropdownId === item.feed_id ? null : item.feed_id)}
                            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors focus:outline-none border border-transparent hover:border-slate-200"
                          >
                            ⋮
                          </button>

                          {activeDropdownId === item.feed_id && (
                            <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 animate-fade-in">
                              {!isSystemAutomatedFeed && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    startEditingWorkflow(item);
                                    setActiveDropdownId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
                                >
                                  Edit Post
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setItemToDelete(item.feed_id);
                                  setActiveDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                              >
                                Delete Post
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Post Content */}
                    <div className="px-5 py-4 bg-white">
                      {!isCurrentlyEditingThisItem ? (
                        <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed font-normal whitespace-pre-wrap break-words">
                          {item.body}
                        </p>
                      ) : (
                        <div className="space-y-3 bg-slate-50 p-4 border border-dashed border-amber-300 rounded-xl">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                              Edit Post Title
                            </label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg font-bold text-slate-900 text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                              Edit Post Body
                            </label>
                            <textarea
                              rows="3"
                              value={editBody}
                              onChange={(e) => setEditBody(e.target.value)}
                              className="w-full p-3 border border-slate-200 bg-white rounded-lg text-slate-800 text-xs focus:outline-none focus:border-amber-500 leading-relaxed"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingItemId(null)}
                              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditChanges(item.feed_id)}
                              className="px-4 py-1.5 bg-[#5C0612] hover:bg-[#720817] text-white text-xs font-bold rounded-lg shadow-sm"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Image Attachment (if any) */}
                      {item.image_url && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 max-h-72 cursor-pointer">
                          <img
                            src={item.image_url}
                            alt=""
                            onClick={() => setLightboxImg(item.image_url)}
                            className="w-full h-full object-cover hover:opacity-95 transition-opacity"
                          />
                        </div>
                      )}
                    </div>

                    {/* Like & Comment Bar */}
                    <div className="px-5 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <button
                        type="button"
                        onClick={() => handleLikeToggle(item.feed_id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors font-medium ${
                          item.is_liked_by_me
                            ? 'text-rose-600 bg-rose-50 font-bold'
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <svg className="w-4 h-4" fill={item.is_liked_by_me ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{item.likes_count || 0} Likes</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCommentsDrawer(item.feed_id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-slate-100 text-slate-600 font-medium transition-colors"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{(item.comments || []).length} Comments</span>
                      </button>
                    </div>

                    {/* Comments Drawer */}
                    {isCommentsOpen && (
                      <div className="bg-slate-50 p-4 border-t border-slate-100 space-y-3">
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {(item.comments || []).length === 0 ? (
                            <p className="text-slate-400 text-xs text-center py-2 italic">No comments yet. Start the conversation below.</p>
                          ) : (
                            item.comments.map((comment, cIdx) => (
                              <div key={cIdx} className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                                <div className="flex justify-between items-center text-[10px] text-slate-400">
                                  <span className="font-bold text-slate-700">{comment.user_email}</span>
                                  <span>{new Date(comment.created_at || item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-slate-800">{comment.comment_text}</p>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Comment Input */}
                        <form onSubmit={(e) => handleSendComment(e, item.feed_id)} className="flex gap-2">
                          <input
                            type="text"
                            value={commentInputs[item.feed_id] || ''}
                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [item.feed_id]: e.target.value }))}
                            placeholder="Write a comment..."
                            className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5C0612]/20"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 bg-[#5C0612] hover:bg-[#720817] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                          >
                            Send
                          </button>
                        </form>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPagesCount > 1 && (
            <div className="flex justify-center items-center gap-1.5 pt-3 pb-2 select-none font-mono text-xs shrink-0 w-full border-t border-slate-200 bg-slate-50 mt-auto rounded-xl">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-30 text-slate-700 font-bold transition-all shadow-sm"
              >
                &lt;
              </button>

              {Array.from({ length: totalPagesCount }, (_, idx) => idx + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-3 py-1.5 border rounded-xl font-bold transition-all shadow-sm ${
                    currentPage === pageNumber
                      ? 'bg-[#5C0612] border-[#5C0612] text-white'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPagesCount}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPagesCount))}
                className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-30 text-slate-700 font-bold transition-all shadow-sm"
              >
                &gt;
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: CAMPUS INTELLIGENCE & GUIDELINES SIDEBAR (Col 5 / Col 4 on wide) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 w-full text-left hidden lg:block sticky top-2 self-start max-h-[calc(100vh-2rem)] overflow-y-auto no-scrollbar pr-1">
          
          {/* Card 1: Live Overview Stats */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-[#5C0612]">
                  CIT-U Ecosystem Telemetry
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm tracking-tight">
                Campus Animal Welfare Overview
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Aggregated activity across university grounds.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center select-none">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-mono text-slate-400 block font-bold">ANIMALS</span>
                <span className="text-lg font-black text-slate-900 font-mono mt-0.5 block">{totalCampusPetsCount}</span>
                <span className="text-[9px] text-slate-500">Registered</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-mono text-slate-400 block font-bold">ADOPTABLE</span>
                <span className="text-lg font-black text-amber-700 font-mono mt-0.5 block">{petsAwaitingHomeCount}</span>
                <span className="text-[9px] text-slate-500">Looking</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-mono text-slate-400 block font-bold">REPORTS</span>
                <span className="text-lg font-black text-slate-900 font-mono mt-0.5 block">{sightingsCount}</span>
                <span className="text-[9px] text-slate-500">Sightings</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-500">
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></span>
                <span>Active campus node synchronized with CIT-U facility database.</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full shrink-0"></span>
                <span>All actions verified with institutional account (`@cit.edu`).</span>
              </p>
            </div>
          </div>

          {/* Card 2: Community Guidelines (No Emojis, clean SVG) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-xs space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#5C0612]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h5 className="font-bold text-slate-900 text-xs tracking-tight">
                Community Posting Guidelines
              </h5>
            </div>

            <ul className="space-y-3 text-slate-600 border-t border-slate-100 pt-3">
              <li className="flex items-start gap-2.5">
                <span className="text-[#5C0612] font-bold">&bull;</span>
                <div>
                  <strong className="text-slate-800 font-semibold block text-xs">1. Include Specific Landmarks</strong>
                  Provide exact locations (building, floor, landmark) to assist responders in locating animals.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#5C0612] font-bold">&bull;</span>
                <div>
                  <strong className="text-slate-800 font-semibold block text-xs">2. Constructive Discussions</strong>
                  Keep all comments focused on animal safety, rescue coordination, and pet adoption.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#5C0612] font-bold">&bull;</span>
                <div>
                  <strong className="text-slate-800 font-semibold block text-xs">3. Protect Physical QR Collars</strong>
                  Never remove or alter collar QR tags on campus animals. They preserve active medical histories.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#5C0612] font-bold">&bull;</span>
                <div>
                  <strong className="text-slate-800 font-semibold block text-xs">4. Immediate Sighting Triage</strong>
                  Spotted an unregistered stray or injured animal? Report it immediately using the Sighting tab.
                </div>
              </li>
            </ul>
          </div>

          {/* Card 3: Quick Contact Box */}
          <div className="bg-[#5C0612]/5 border border-[#5C0612]/15 rounded-2xl p-4 text-xs space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C0612] font-mono block">
              Emergency Contact & Marshals
            </span>
            <p className="text-slate-700">
              For aggressive animals, critical injuries, or rabies bite assistance, immediately contact the <strong>CIT-U Medical-Dental Clinic (MDC)</strong> or campus security officers.
            </p>
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal (Clean SVG, No Emoji) */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-sm w-full p-6 text-center animate-scale-up space-y-3">
            <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">Confirm Deletion</h3>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Are you sure you want to permanently delete this post? All associated comments will also be removed.
              </p>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition-all shadow-sm"
              >
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Image Preview */}
      {lightboxImg && (
        <div onClick={() => setLightboxImg(null)} className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in">
          <button type="button" className="absolute top-4 sm:top-6 right-4 sm:right-6 text-white/70 hover:text-white font-mono text-xs bg-white/10 hover:bg-white/20 p-2 px-4 rounded-xl transition-all">✕ CLOSE</button>
          <img src={lightboxImg} alt="Expanded Media" className="max-w-full max-h-[85vh] sm:max-h-[92vh] rounded-lg shadow-2xl object-contain animate-scale-up" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}