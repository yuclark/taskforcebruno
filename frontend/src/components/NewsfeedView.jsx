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
      <div className="w-full text-center p-12 font-mono text-[11px] text-slate-400 animate-pulse">
        COMPILING COMMUNITY INTERACTION MATRICES...
      </div>
    );
  }

  const activeSightingsCount = feedItems.filter(i => i.item_type === 'sighting').length;
  const recentRescuesCount = feedItems.filter(i => i.item_type === 'pet').length;

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
    <div className="w-full max-w-5xl mx-auto px-1 sm:px-4 font-sans antialiased h-full flex flex-col overflow-hidden">
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
        <div className="lg:col-span-7 w-full h-full flex flex-col min-h-0 bg-transparent">
          <div className="flex justify-between items-center bg-white px-4 py-3 rounded-xl border border-slate-200/80 shadow-sm select-none shrink-0 mb-3">
            <span className="font-mono text-[9px] font-black text-slate-400 uppercase tracking-wildest truncate mr-2">
              Live Activity Node &bull; {filteredFeedItems.length} Feeds Match
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2.5 shrink-0 mb-3">
            <div className="text-slate-400 pl-1.5 select-none text-xs">🔍</div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter active newsfeed logs by keywords, tags, or badges..."
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

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar min-h-0 pb-4">
            {paginatedFeedItems.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 italic">
                No active records match your search criteria parameters.
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
                  <div key={item.feed_id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-left w-full animate-fade-in">
                    <div className="p-4 flex items-start justify-between border-b border-slate-50 gap-3 relative">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm select-none shadow-inner border border-black/5 text-white shrink-0 ${isAnnouncement ? 'bg-gradient-to-br from-black to-neutral-800' : 'bg-slate-500'}`}>
                          {initials}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap max-w-full">
                            {!isCurrentlyEditingThisItem ? (
                              <h4 className="font-bold text-slate-900 text-sm sm:text-[14px] tracking-tight leading-tight break-words pr-1">
                                {item.title}
                              </h4>
                            ) : (
                              <span className="text-[9px] font-mono bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                Modifying Record Payload
                              </span>
                            )}
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider border shrink-0 ${isAnnouncement ? 'bg-stone-100 text-neutral-900 border-stone-300' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                              {item.badge_text}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 font-normal mt-0.5 flex-wrap min-w-0">
                            <span className="hover:underline cursor-pointer truncate max-w-[120px] sm:max-w-[180px]">{item.author_tag}</span>
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
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50/60 transition-colors"
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
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50/60 transition-colors"
                              >
                                Delete Post
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-3 bg-white">
                      {!isCurrentlyEditingThisItem ? (
                        <p className="text-[13px] text-slate-800 leading-snug font-normal whitespace-pre-wrap break-words">
                          {item.body}
                        </p>
                      ) : (
                        <div className="space-y-3 bg-slate-50 p-3 sm:p-4 border border-dashed border-amber-300 rounded-xl">
                          <div>
                            <label className="block text-[9px] font-mono font-bold text-amber-800 uppercase tracking-wider mb-1">
                              Modify Bulletin Title Header
                            </label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-3 py-2 border bg-white rounded-lg font-bold text-slate-900 text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono font-bold text-amber-800 uppercase tracking-wider mb-1">
                              Modify Broadcast Narrative Content
                            </label>
                            <textarea
                              rows="3"
                              value={editBody}
                              onChange={(e) => setEditBody(e.target.value)}
                              className="w-full p-3 border bg-white rounded-lg text-slate-800 text-xs focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                            />
                          </div>
                          <div className="flex gap-2 justify-end text-[10px] font-mono font-bold uppercase">
                            <button type="button" onClick={() => setEditingItemId(null)} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all">
                              Cancel
                            </button>
                            <button type="button" onClick={() => handleSaveEditChanges(item.feed_id)} className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all shadow-sm">
                              Save
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="mt-2.5 text-[9px] sm:text-[10px] text-slate-500 bg-slate-100/80 border border-slate-200/50 rounded-md px-2 py-0.5 w-fit font-mono font-medium max-w-full truncate">
                        Context Metric: <span className="font-sans text-slate-700 font-normal">{item.meta_details}</span>
                      </div>
                    </div>

                    {item.image_url && (
                      <div
                        onClick={() => setLightboxImg(item.image_url)}
                        className="w-full h-64 sm:h-96 border-y border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden cursor-zoom-in hover:brightness-95 transition-all shrink-0"
                      >
                        <img src={item.image_url} alt="Attached Media Asset" className="w-full h-full object-cover select-none" />
                      </div>
                    )}

                    <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-200 text-slate-500 text-[11px] sm:text-[12px] font-normal select-none">
                      <div className="flex items-center gap-1.5">
                        {item.likes_count > 0 && (
                          <span className="bg-[#1877F2] text-white p-1 rounded-full text-[8px] w-4 h-4 flex items-center justify-center shadow-sm">👍</span>
                        )}
                        <span className="hover:underline cursor-pointer">
                          {item.likes_count} {item.likes_count === 1 ? 'like' : 'likes'}
                        </span>
                      </div>
                      <div
                        onClick={() => toggleCommentsDrawer(item.feed_id)}
                        className="hover:underline cursor-pointer text-slate-500 font-medium"
                      >
                        {item.comments?.length || 0} {item.comments?.length === 1 ? 'comment' : 'comments'} {isCommentsOpen ? '▲' : '▼'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 border-b border-slate-100 px-2 py-0.5 bg-white select-none">
                      <button
                        type="button"
                        onClick={() => handleLikeToggle(item.feed_id)}
                        className={`flex items-center justify-center gap-2 py-2 rounded-md font-bold text-xs sm:text-[13px] transition-all hover:bg-slate-100/80 ${item.is_liked_by_me ? 'text-[#1877F2]' : 'text-slate-600'}`}
                      >
                        Like
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCommentsDrawer(item.feed_id)}
                        className={`flex items-center justify-center gap-2 py-2 rounded-md font-bold text-xs sm:text-[13px] hover:bg-slate-100/80 transition-all ${isCommentsOpen ? 'text-black bg-stone-50' : 'text-slate-600'}`}
                      >
                        Comment
                      </button>
                    </div>

                    {isCommentsOpen && (
                      <div className="bg-[#F0F2F5]/60 px-3 sm:px-4 py-3 space-y-2.5 border-t border-slate-100 animate-fade-in">
                        {item.comments && item.comments.map((comm) => (
                          <div key={comm.comment_id} className="flex gap-2 text-left items-start group relative">
                            <div className="w-7 h-7 rounded-full bg-slate-400 text-white flex items-center justify-center font-bold text-[10px] uppercase shrink-0 border border-black/5 select-none shadow-sm">
                              {(comm.user_email || 'CU').substring(0, 2)}
                            </div>

                            <div className="flex-1 min-w-0 flex items-center gap-1.5 max-w-[85%] sm:max-w-[88%]">
                              <div className="bg-[#E4E6EB] rounded-2xl px-3 py-1.5 shadow-sm break-words flex-1 min-w-0">
                                <p className="font-bold text-slate-900 text-[10px] sm:text-[11px] leading-tight mb-0.5 hover:underline cursor-pointer truncate max-w-full">
                                  {comm.user_email}
                                </p>
                                <p className="text-slate-800 text-xs sm:text-[12px] leading-snug font-normal">{comm.comment_text}</p>
                              </div>
                            </div>
                          </div>
                        ))}

                        <form onSubmit={(e) => handleSendComment(e, item.feed_id)} className="flex items-center gap-2 pt-1">
                          <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-bold text-[10px] uppercase shrink-0 select-none border border-black/5 shadow-inner">
                            {(currentUserEmail || 'CU').substring(0, 2)}
                          </div>
                          <div className="flex-1 relative flex items-center">
                            <input
                              type="text"
                              value={commentInputs[item.feed_id] || ''}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, [item.feed_id]: e.target.value }))}
                              placeholder="Write a comment..."
                              className="w-full bg-[#E4E6EB] border border-transparent rounded-full pl-4 pr-14 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-300 transition-all placeholder-slate-500 shadow-inner"
                            />
                            <button type="submit" className="absolute right-1 bg-black hover:bg-neutral-800 text-white font-bold text-[9px] uppercase px-2.5 py-1 rounded-full transition-all shadow-sm tracking-wider">
                              Send
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Persistent Pagination Drawer Base Module */}
          {totalPagesCount > 1 && (
            <div className="flex justify-center items-center gap-1.5 pt-3 pb-2 select-none font-mono text-xs shrink-0 w-full border-t border-slate-200 bg-slate-50 mt-auto">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); }}
                className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-slate-700 font-black transition-all shadow-sm"
              >
                &lt;
              </button>

              {Array.from({ length: totalPagesCount }, (_, idx) => idx + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => { setCurrentPage(pageNumber); }}
                  className={`px-3 py-1.5 border rounded-xl font-bold transition-all shadow-sm ${
                    currentPage === pageNumber
                      ? 'bg-black border-black text-white shadow-inner'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPagesCount}
                onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPagesCount)); }}
                className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-slate-700 font-black transition-all shadow-sm"
              >
                &gt;
              </button>
            </div>
          )}
        </div>

        {/* Right Info Sidebar Layout Panel */}
        <div className="lg:col-span-5 space-y-4 w-full text-left hidden lg:block sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto no-scrollbar pr-1">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h4 className="font-black text-slate-900 text-sm tracking-tight">Ecosystem Intelligence Console</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 font-normal">Real-time macro parameters aggregated from tracking tables.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-center">
              <div className="bg-amber-50/40 border border-amber-200 p-3 rounded-xl">
                <span className="block text-xl font-black text-amber-800 leading-tight">{activeSightingsCount}</span>
                <span className="text-[8px] uppercase font-bold text-amber-500 tracking-wider block mt-1">Active Sightings</span>
              </div>
              <div className="bg-emerald-50/40 border border-emerald-200 p-3 rounded-xl">
                <span className="block text-xl font-black text-emerald-800 leading-tight">{recentRescuesCount}</span>
                <span className="text-[8px] uppercase font-bold text-emerald-500 tracking-wider block mt-1">Companions Indexed</span>
              </div>
            </div>

            <div className="border-t pt-3 space-y-2 text-[11px] text-slate-500 leading-relaxed font-normal">
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></span>
                <span>Active node synchronized with Cebu Institute of Technology – University facility bounds.</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full shrink-0"></span>
                <span>All actions are signed using your institutional email domain balance (`@cit.edu`).</span>
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-black/5 via-white to-white border border-slate-200 rounded-xl p-5 shadow-sm text-[11px] leading-relaxed space-y-3">
            <div>
              <h5 className="font-black text-slate-900 text-[12px] tracking-tight flex items-center gap-2">
                🛡️ Community Code of Conduct Matrix
              </h5>
              <p className="text-[10px] text-slate-400 font-normal block mt-0.5">Mandatory compliance baselines for logged users and peer facilitators.</p>
            </div>

            <ul className="space-y-2.5 text-slate-600 font-normal list-inside list-none border-t pt-2.5">
              <li className="flex items-start gap-2">
                <span className="text-black font-black mt-0.5">&bull;</span>
                <div><strong className="text-slate-800 font-semibold block">01. Landmark Context Matrix</strong>Always attach explicit Location Matrix Context landmarks when submitting sightings to aid rapid response teams.</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black font-black mt-0.5">&bull;</span>
                <div><strong className="text-slate-800 font-semibold block">02. Communication Guardrails</strong>Keep comment response tracks clean, constructive, and oriented toward companion welfare tracking parameters.</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black font-black mt-0.5">&bull;</span>
                <div><strong className="text-slate-800 font-semibold block">03. QR Collar Asset Protection</strong>Never remove or exchange physical tracking collars from campus pets; doing so breaks active relational database mappings.</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black font-black mt-0.5">&bull;</span>
                <div><strong className="text-slate-800 font-semibold block">04. Telemetry Discrepancy Reports</strong>Report corrupted media asset links, invalid profile details, or broken data maps to portal node admins immediately.</div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Confirmation Overlay Modals */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-sm w-full p-5 sm:p-6 text-center animate-scale-up">
            <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3 text-lg">⚠️</div>
            <h3 className="font-black text-slate-900 text-sm tracking-tight mb-1">Confirm Record Purge</h3>
            <p className="text-slate-500 text-[11px] leading-relaxed mb-5 font-normal">Are you absolutely sure you want to permanently scrub this log entry? This operation will instantly wipe all linked community interactions and can't be undone.</p>
            <div className="flex gap-3 justify-center font-mono text-[10px] font-bold uppercase">
              <button type="button" onClick={() => setItemToDelete(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all tracking-wider">Cancel</button>
              <button type="button" onClick={handleExecuteDelete} className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl transition-all shadow-sm tracking-wider">Scrub Log Entry</button>
            </div>
          </div>
        </div>
      )}

      {lightboxImg && (
        <div onClick={() => setLightboxImg(null)} className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in">
          <button type="button" className="absolute top-4 sm:top-6 right-4 sm:right-6 text-white/70 hover:text-white font-mono text-[10px] sm:text-xs bg-white/10 hover:bg-white/20 p-2 px-3 sm:px-4 rounded-xl transition-all">✕ CLOSE</button>
          <img src={lightboxImg} alt="Expanded Media" className="max-w-full max-h-[85vh] sm:max-h-[92vh] rounded-lg shadow-2xl object-contain animate-scale-up" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}