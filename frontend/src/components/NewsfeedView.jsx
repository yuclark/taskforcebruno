import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Heart,
  Info,
  MapPin,
  MessageSquare,
  MoreVertical,
  RotateCw,
  Search,
  ShieldCheck,
  Siren,
  X,
} from 'lucide-react';
import { apiDelete, apiGet, apiPost, apiPut } from '../lib/api';
import { isStaffSession } from '../lib/auth';
import { formatCommentTime, formatFeedDate } from '../lib/dates';
import { isAdoptablePet, safeImageUrl } from '../lib/pets';
import UserAvatar from './UserAvatar';

function formatAuthorName(rawTag) {
  const s = String(rawTag || '').trim();
  if (!s) return 'CIT-U Member';
  if (!s.includes('@')) return s;
  const local = s.split('@')[0];
  if (local.toLowerCase().includes('mdc')) return 'CIT-U MDC Clinic';
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getAuthorInitials(rawTag) {
  const name = formatAuthorName(rawTag);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'CU';
}

export default function NewsfeedView({ session }) {
  const [feedItems, setFeedItems] = useState([]);
  const [petsData, setPetsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [commentInputs, setCommentInputs] = useState({});
  const [postingCommentId, setPostingCommentId] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  const [editingItemId, setEditingItemId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [savingPostEdit, setSavingPostEdit] = useState(false);

  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deletingItem, setDeletingItem] = useState(false);
  const [moderationError, setModerationError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileInfo, setShowMobileInfo] = useState(false);
  const [feedFilter, setFeedFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedComments, setExpandedComments] = useState({});
  const [expandedBodies, setExpandedBodies] = useState({});

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [savingCommentEdit, setSavingCommentEdit] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [deletingComment, setDeletingComment] = useState(false);

  const currentUserEmail = (session?.email || '').trim().toLowerCase();
  const isStaffClearance = isStaffSession(session);

  const fetchStreamData = useCallback(async () => {
    setRefreshing(true);
    setLoadError('');
    const [feedRes, petsRes] = await Promise.all([
      apiGet('/newsfeed/'),
      apiGet('/pets/'),
    ]);

    if (feedRes.ok && Array.isArray(feedRes.data)) {
      setFeedItems(feedRes.data);
    } else if (!feedRes.aborted) {
      setLoadError(feedRes.error || 'Unable to load the community newsfeed.');
    }

    if (petsRes.ok && Array.isArray(petsRes.data)) {
      setPetsData(petsRes.data);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const init = async () => {
      setLoading(true);
      setLoadError('');
      const [feedRes, petsRes] = await Promise.all([
        apiGet('/newsfeed/', { signal: controller.signal }),
        apiGet('/pets/', { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;

      if (feedRes.ok && Array.isArray(feedRes.data)) {
        setFeedItems(feedRes.data);
      } else {
        setLoadError(feedRes.error || 'Unable to load the community newsfeed.');
      }

      if (petsRes.ok && Array.isArray(petsRes.data)) {
        setPetsData(petsRes.data);
      }
      setLoading(false);
    };
    init();
    return () => controller.abort();
  }, [currentUserEmail]);

  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownId(null);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveDropdownId(null);
        setLightboxImg(null);
        setItemToDelete(null);
        setCommentToDelete(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLikeToggle = async (feedId) => {
    const flipLike = (items) =>
      items.map((item) => {
        if (item.feed_id !== feedId) return item;
        return {
          ...item,
          is_liked_by_me: !item.is_liked_by_me,
          likes_count: item.is_liked_by_me ? Math.max(0, item.likes_count - 1) : item.likes_count + 1,
        };
      });

    setFeedItems((prev) => flipLike(prev));
    const res = await apiPost('/newsfeed/like/', { feed_id: feedId });
    if (!res.ok) {
      setFeedItems((prev) => flipLike(prev));
    }
  };

  const handleSendComment = async (e, feedId) => {
    e.preventDefault();
    const text = (commentInputs[feedId] || '').trim();
    if (!text || postingCommentId === feedId) return;

    setModerationError('');
    setPostingCommentId(feedId);
    const res = await apiPost('/newsfeed/comment/', {
      feed_id: feedId,
      comment_text: text,
    });
    if (res.ok) {
      setCommentInputs((prev) => ({ ...prev, [feedId]: '' }));
      await fetchStreamData();
    } else {
      setModerationError(res.error || 'Unable to post your comment.');
    }
    setPostingCommentId(null);
  };

  const handleSaveCommentEdit = async (commentId) => {
    const trimmed = editCommentText.trim();
    if (!trimmed) {
      setModerationError('Comment text cannot be empty.');
      return;
    }
    if (commentId === null || commentId === undefined || commentId === '') {
      setModerationError('Could not identify the comment to update.');
      return;
    }
    setModerationError('');
    setSavingCommentEdit(true);
    const res = await apiPut('/newsfeed/comment/action/', {
      comment_id: commentId,
      comment_text: trimmed,
    });
    if (res.ok) {
      setFeedItems((prev) =>
        prev.map((item) => ({
          ...item,
          comments: (item.comments || []).map((c) =>
            (c.comment_id ?? c.id) === commentId ? { ...c, comment_text: trimmed } : c
          ),
        }))
      );
      setEditingCommentId(null);
      setEditCommentText('');
      await fetchStreamData();
    } else {
      setModerationError(res.error || 'Failed to update comment.');
    }
    setSavingCommentEdit(false);
  };

  const handleExecuteCommentDelete = async () => {
    if (!commentToDelete || deletingComment) return;
    setDeletingComment(true);
    const res = await apiDelete(
      `/newsfeed/comment/action/?comment_id=${encodeURIComponent(commentToDelete)}`
    );
    if (res.ok) {
      setCommentToDelete(null);
      await fetchStreamData();
    } else {
      setModerationError(res.error || 'Failed to delete comment.');
    }
    setDeletingComment(false);
  };

  const handleExecuteDelete = async () => {
    if (!itemToDelete || deletingItem) return;
    setDeletingItem(true);
    const res = await apiDelete(
      `/newsfeed/action/?feed_id=${encodeURIComponent(itemToDelete)}`
    );
    if (res.ok) {
      setItemToDelete(null);
      await fetchStreamData();
    } else {
      setModerationError(res.error || 'Unable to delete post.');
    }
    setDeletingItem(false);
  };

  const handleSaveEditChanges = async (feedId) => {
    if (!editTitle.trim() || !editBody.trim() || savingPostEdit) {
      setModerationError('Both post title and body are required.');
      return;
    }
    setSavingPostEdit(true);
    const res = await apiPut('/newsfeed/action/', {
      feed_id: feedId,
      title: editTitle.trim(),
      body: editBody.trim(),
    });
    if (res.ok) {
      setEditingItemId(null);
      setEditTitle('');
      setEditBody('');
      await fetchStreamData();
    } else {
      setModerationError(res.error || 'Unable to save changes.');
    }
    setSavingPostEdit(false);
  };

  const startEditingWorkflow = (item) => {
    setModerationError('');
    setEditingItemId(item.feed_id);
    setEditTitle(item.title || '');
    setEditBody(item.body || '');
  };

  const toggleCommentsDrawer = (feedId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [feedId]: !prev[feedId],
    }));
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-4">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3.5 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <div className="space-y-2 flex-1">
                <div className="h-3.5 bg-slate-200 rounded w-2/5" />
                <div className="h-2.5 bg-slate-100 rounded w-1/4" />
              </div>
            </div>
            <div className="h-3 bg-slate-100 rounded w-full" />
            <div className="h-3 bg-slate-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  const roamingPetsCount =
    petsData.length > 0
      ? petsData.filter((p) => (p.adoption_status || '').toLowerCase() !== 'adopted').length
      : feedItems.filter(
          (i) => i.item_type === 'pet' && (i.badge_text || '').toLowerCase() !== 'adopted'
        ).length;

  const petsAwaitingHomeCount =
    petsData.length > 0
      ? petsData.filter(isAdoptablePet).length
      : feedItems.filter((i) => {
          if (i.item_type !== 'pet') return false;
          const badge = (i.badge_text || '').toLowerCase();
          return badge === 'available' || badge === 'stray' || badge.includes('adoption');
        }).length;

  const sightingsCount = feedItems.filter((i) => i.item_type === 'sighting').length;
  const announcementsCount = feedItems.filter((i) => i.item_type === 'announcement').length;
  const petPostsCount = feedItems.filter((i) => i.item_type === 'pet').length;
  const urgentPostsCount = feedItems.filter(
    (i) =>
      i.is_urgent ||
      (i.badge_text || '').toLowerCase().includes('urgent') ||
      (i.body || '').toLowerCase().includes('urgent emergency')
  ).length;

  const filteredFeedItems = feedItems.filter((item) => {
    if (feedFilter === 'announcement' && item.item_type !== 'announcement') return false;
    if (feedFilter === 'sighting' && item.item_type !== 'sighting') return false;
    if (feedFilter === 'pet' && item.item_type !== 'pet') return false;
    if (feedFilter === 'urgent') {
      const isUrgent =
        item.is_urgent ||
        (item.badge_text || '').toLowerCase().includes('urgent') ||
        (item.body || '').toLowerCase().includes('urgent emergency');
      if (!isUrgent) return false;
    }

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      item.title?.toLowerCase().includes(query) ||
      item.body?.toLowerCase().includes(query) ||
      item.meta_details?.toLowerCase().includes(query) ||
      item.author_tag?.toLowerCase().includes(query) ||
      item.badge_text?.toLowerCase().includes(query)
    );
  });

  const ITEMS_PER_PAGE = 6;
  const totalPagesCount = Math.ceil(filteredFeedItems.length / ITEMS_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPagesCount));
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedFeedItems = filteredFeedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const filterTabs = [
    { key: 'all', label: 'All', count: feedItems.length },
    ...(urgentPostsCount > 0
      ? [{ key: 'urgent', label: 'Urgent', count: urgentPostsCount, urgent: true }]
      : []),
    { key: 'announcement', label: 'Bulletins', count: announcementsCount },
    { key: 'sighting', label: 'Sightings', count: sightingsCount },
    { key: 'pet', label: 'Pets', count: petPostsCount },
  ];

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl mx-auto font-sans antialiased flex flex-col gap-4 pb-8">
      {loadError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={fetchStreamData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-100 border border-rose-200 text-rose-800 font-semibold rounded-xl transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {moderationError && (
        <div
          role="alert"
          className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 font-medium rounded-xl flex items-center justify-between gap-2 text-xs"
        >
          <span>{moderationError}</span>
          <button
            type="button"
            onClick={() => setModerationError('')}
            aria-label="Dismiss error"
            className="p-1 text-rose-500 hover:text-rose-800 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Feed Stream */}
        <div className="lg:col-span-7 xl:col-span-8 w-full flex flex-col gap-4">
          {/* Sleek Mobile & Desktop Unified Toolbar (de-congested on mobile) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3 sm:p-3.5 space-y-3">
            {/* Top Row: Compact Snapshot + Quick Action Buttons */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 sm:gap-3 text-xs min-w-0">
                <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{roamingPetsCount} On Campus</span>
                </span>
                <span className="text-slate-300 hidden xs:inline">&bull;</span>
                <span className="font-semibold text-amber-800 whitespace-nowrap">
                  {petsAwaitingHomeCount} Adoptable
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowMobileSearch((prev) => !prev)}
                  aria-label="Toggle search"
                  className={`sm:hidden p-2 rounded-xl border transition-colors ${
                    showMobileSearch || searchQuery
                      ? 'bg-[#5C0612] text-white border-[#5C0612]'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <Search className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowMobileInfo((prev) => !prev)}
                  className={`lg:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-colors ${
                    showMobileInfo
                      ? 'bg-[#5C0612]/10 text-[#5C0612] border-[#5C0612]/25'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Info</span>
                  {showMobileInfo ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={fetchStreamData}
                  disabled={refreshing}
                  aria-label="Refresh feed"
                  className="inline-flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 text-[11px] font-semibold text-slate-600 hover:text-[#5C0612] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* Collapsible Mobile Campus Info Drawer (replaces bottom wall of cards on mobile) */}
            {showMobileInfo && (
              <div className="lg:hidden rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-3 text-xs animate-fade-in">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                    <span className="text-[10px] text-slate-500 font-semibold block">On Campus</span>
                    <span className="text-base font-black text-slate-900 tabular-nums">{roamingPetsCount}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                    <span className="text-[10px] text-slate-500 font-semibold block">Adoptable</span>
                    <span className="text-base font-black text-amber-700 tabular-nums">{petsAwaitingHomeCount}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                    <span className="text-[10px] text-slate-500 font-semibold block">Sightings</span>
                    <span className="text-base font-black text-slate-900 tabular-nums">{sightingsCount}</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 space-y-1 leading-relaxed">
                  <p className="font-bold text-slate-800">Quick Guidelines</p>
                  <p>&bull; Mention exact CIT-U buildings (GLE, NGE, RTL, SAL, P.E Area) in sightings.</p>
                  <p>&bull; Never remove collar QR tags from resident animals.</p>
                  <p>
                    &bull; Bites or injuries? Call CIT-U MDC / Security:{' '}
                    <a href="tel:0322617741" className="font-mono font-bold text-[#5C0612] underline">
                      (032) 261-7741
                    </a>
                  </p>
                </div>
              </div>
            )}

            {/* Filter Chips: Clean Wrapped Pill Bar */}
            <div className="flex flex-wrap items-center gap-1.5">
              {filterTabs.map((tab) => {
                const isActive = feedFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setFeedFilter(tab.key);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap inline-flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? tab.urgent
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-[#5C0612] text-white border-[#5C0612] shadow-xs'
                        : tab.urgent
                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        : 'bg-slate-50 text-slate-600 border-slate-200/90 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : tab.urgent
                          ? 'bg-rose-200/70 text-rose-800'
                          : 'bg-white text-slate-500'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input (Always visible on sm+, toggleable on mobile to save vertical space) */}
            <div
              className={`${
                showMobileSearch || searchQuery ? 'flex' : 'hidden sm:flex'
              } bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80 items-center gap-2 focus-within:bg-white focus-within:border-[#5C0612]/40 transition-colors`}
            >
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search posts, pet names, or CIT-U buildings..."
                className="w-full bg-transparent text-base sm:text-xs text-slate-800 focus:outline-none placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="text-slate-500 hover:text-slate-800 text-xs font-semibold px-2 py-0.5 bg-white border border-slate-200 rounded-lg transition-colors shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Feed Cards */}
          <div className="space-y-4">
            {paginatedFeedItems.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2.5">
                <p className="text-slate-700 font-bold text-sm">No matching posts</p>
                <p className="text-slate-400 text-xs">
                  No announcements or sightings match your current filter.
                </p>
                {(feedFilter !== 'all' || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFeedFilter('all');
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            ) : (
              paginatedFeedItems.map((item) => {
                const authorName = (item.author_name || '').trim() || formatAuthorName(item.author_tag);
                const initials = getAuthorInitials(authorName);
                const formattedTimestamp = formatFeedDate(item.timestamp);
                const isAnnouncement = item.item_type === 'announcement';
                const isUrgent =
                  item.is_urgent || (item.badge_text || '').toUpperCase().includes('EMERGENCY');
                const isSystemAutomatedFeed =
                  item.item_type === 'sighting' ||
                  item.item_type === 'pet' ||
                  item.author_tag === 'mdc.operations@cit.edu';
                const isEditing = editingItemId === item.feed_id;
                const isCommentsOpen = Boolean(expandedComments[item.feed_id]);
                const imgSrc = safeImageUrl(item.image_url);
                const bodyText = String(item.body || '');
                const isLongBody = bodyText.length > 260;
                const isBodyExpanded = Boolean(expandedBodies[item.feed_id]);
                const displayedBody =
                  isLongBody && !isBodyExpanded ? `${bodyText.slice(0, 260).trim()}...` : bodyText;

                return (
                  <article
                    key={item.feed_id}
                    className={`bg-white border rounded-2xl shadow-xs overflow-hidden text-left w-full transition-shadow hover:shadow-sm ${
                      isUrgent ? 'border-rose-300 ring-1 ring-rose-100' : 'border-slate-200/90'
                    }`}
                  >
                    {/* Clean Post Header */}
                    <div className="px-4 pt-4 pb-3 sm:px-5 sm:pt-5 flex items-start justify-between gap-3 relative">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {isUrgent ? (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs select-none shrink-0 shadow-xs bg-rose-600 text-white">
                            <Siren className="w-5 h-5" />
                          </div>
                        ) : (
                          <UserAvatar
                            src={item.author_avatar}
                            initials={initials}
                            name={authorName}
                            size="lg"
                            roundedClass="rounded-full"
                            fallbackClassName={
                              isAnnouncement
                                ? 'bg-[#5C0612] text-[#D4AF37]'
                                : 'bg-slate-800 text-white'
                            }
                            className="shadow-xs"
                          />
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-bold text-slate-900 truncate">{authorName}</span>
                            <span className="text-slate-300">&bull;</span>
                            <span className="text-[11px] text-slate-400 shrink-0">
                              {formattedTimestamp}
                            </span>
                          </div>

                          {/* Calm Tag + Location Sub-row */}
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border shrink-0 ${
                                isUrgent
                                  ? 'bg-rose-600 text-white border-rose-700'
                                  : isAnnouncement
                                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {isUrgent && <Siren className="w-2.5 h-2.5 shrink-0" />}
                              <span>{(item.badge_text || '').replace('🚨', '').trim()}</span>
                            </span>

                            {item.meta_details && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200/70 max-w-full">
                                <MapPin className="w-3 h-3 text-[#5C0612] shrink-0" />
                                <span className="truncate max-w-[180px] sm:max-w-[260px]">
                                  {item.meta_details}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isStaffClearance && !isEditing && (
                        <div className="shrink-0 relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            aria-label="Post options"
                            onClick={() =>
                              setActiveDropdownId(activeDropdownId === item.feed_id ? null : item.feed_id)
                            }
                            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
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
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 transition-colors"
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

                    {/* Spacious Post Body */}
                    <div className="px-4 sm:px-5 pb-4 space-y-3">
                      {!isEditing ? (
                        <div className="space-y-1.5">
                          <h4 className="font-extrabold text-slate-900 text-sm sm:text-[15px] tracking-tight leading-snug break-words">
                            {item.title}
                          </h4>
                          <p className="text-[13px] sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
                            {displayedBody}
                          </p>
                          {isLongBody && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedBodies((prev) => ({
                                  ...prev,
                                  [item.feed_id]: !prev[item.feed_id],
                                }))
                              }
                              className="text-xs font-bold text-[#5C0612] hover:underline"
                            >
                              {isBodyExpanded ? 'Show less' : 'Read more'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 bg-slate-50 p-4 border border-amber-300 rounded-xl">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Post Title
                            </label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg font-semibold text-slate-900 text-sm sm:text-xs focus:outline-none focus:border-[#5C0612]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Post Content
                            </label>
                            <textarea
                              rows="3"
                              value={editBody}
                              onChange={(e) => setEditBody(e.target.value)}
                              className="w-full p-3 border border-slate-200 bg-white rounded-lg text-slate-800 text-sm sm:text-xs focus:outline-none focus:border-[#5C0612] leading-relaxed"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              disabled={savingPostEdit}
                              onClick={() => setEditingItemId(null)}
                              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={savingPostEdit}
                              onClick={() => handleSaveEditChanges(item.feed_id)}
                              className="px-4 py-1.5 bg-[#5C0612] hover:bg-[#42040B] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs"
                            >
                              {savingPostEdit ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </div>
                      )}

                      {imgSrc && (
                        <button
                          type="button"
                          onClick={() => setLightboxImg(imgSrc)}
                          className="w-full rounded-xl overflow-hidden border border-slate-200/80 bg-slate-100 cursor-pointer group flex items-center justify-center relative"
                        >
                          <img
                            src={imgSrc}
                            alt={item.title || 'Campus update'}
                            className="w-full max-h-[340px] sm:max-h-[440px] h-auto object-cover sm:object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                            loading="lazy"
                          />
                          <span className="absolute bottom-2.5 right-2.5 bg-black/65 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            Expand
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Touch-Friendly Engagement Footer */}
                    <div className="px-2 py-1.5 bg-slate-50/70 border-t border-slate-100 grid grid-cols-2 gap-1 text-xs text-slate-600">
                      <button
                        type="button"
                        onClick={() => handleLikeToggle(item.feed_id)}
                        className={`min-h-[40px] inline-flex items-center justify-center gap-2 rounded-xl transition-colors font-semibold ${
                          item.is_liked_by_me
                            ? 'text-rose-600 bg-rose-50'
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${item.is_liked_by_me ? 'fill-current' : ''}`} />
                        <span>
                          {item.likes_count || 0} {item.likes_count === 1 ? 'Like' : 'Likes'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCommentsDrawer(item.feed_id)}
                        className={`min-h-[40px] inline-flex items-center justify-center gap-2 rounded-xl transition-colors font-semibold ${
                          isCommentsOpen
                            ? 'bg-slate-200/70 text-slate-900'
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        <span>
                          {(item.comments || []).length}{' '}
                          {(item.comments || []).length === 1 ? 'Comment' : 'Comments'}
                        </span>
                      </button>
                    </div>

                    {/* Comments Drawer */}
                    {isCommentsOpen && (
                      <div className="bg-slate-50/90 p-3.5 sm:p-4 border-t border-slate-100 space-y-3">
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {(item.comments || []).length === 0 ? (
                            <p className="text-slate-400 text-xs text-center py-2">
                              No comments yet. Be the first to reply.
                            </p>
                          ) : (
                            item.comments.map((comment, cIdx) => {
                              const resolvedCommentId = comment.comment_id ?? comment.id;
                              const isMyComment =
                                (comment.user_email || '').trim().toLowerCase() === currentUserEmail;
                              const canDeleteComment = isMyComment || isStaffClearance;
                              const isEditingComment =
                                resolvedCommentId !== undefined &&
                                resolvedCommentId !== null &&
                                editingCommentId === resolvedCommentId;

                              return (
                                <div
                                  key={resolvedCommentId ?? cIdx}
                                  className="bg-white p-3 rounded-xl border border-slate-200/80 text-xs space-y-1.5"
                                >
                                  <div className="flex justify-between items-center text-[11px] text-slate-400 gap-2 flex-wrap">
                                    <span className="flex items-center gap-2 min-w-0">
                                      <UserAvatar
                                        src={comment.user_avatar}
                                        initials={getAuthorInitials(
                                          (comment.user_name || '').trim() || comment.user_email
                                        )}
                                        name={(comment.user_name || '').trim() || formatAuthorName(comment.user_email)}
                                        size="xs"
                                        roundedClass="rounded-full"
                                        fallbackClassName="bg-slate-200 text-slate-700"
                                      />
                                      <span className="font-bold text-slate-800 truncate">
                                        {(comment.user_name || '').trim() || formatAuthorName(comment.user_email)}
                                      </span>
                                    </span>
                                    <div className="flex items-center gap-2.5 shrink-0">
                                      <span>
                                        {formatCommentTime(
                                          comment.timestamp || comment.created_at || item.timestamp
                                        )}
                                      </span>
                                      {resolvedCommentId !== undefined &&
                                        resolvedCommentId !== null &&
                                        !isEditingComment && (
                                          <>
                                            {isMyComment && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setModerationError('');
                                                  setEditingCommentId(resolvedCommentId);
                                                  setEditCommentText(comment.comment_text || '');
                                                }}
                                                className="text-amber-700 hover:underline font-semibold"
                                              >
                                                Edit
                                              </button>
                                            )}
                                            {canDeleteComment && (
                                              <button
                                                type="button"
                                                onClick={() => setCommentToDelete(resolvedCommentId)}
                                                className="text-rose-600 hover:underline font-semibold"
                                              >
                                                Delete
                                              </button>
                                            )}
                                          </>
                                        )}
                                    </div>
                                  </div>

                                  {isEditingComment ? (
                                    <form
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSaveCommentEdit(resolvedCommentId);
                                      }}
                                      className="flex flex-wrap gap-1.5 pt-1"
                                    >
                                      <input
                                        type="text"
                                        autoFocus
                                        value={editCommentText}
                                        onChange={(e) => setEditCommentText(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Escape') {
                                            setEditingCommentId(null);
                                            setEditCommentText('');
                                          }
                                        }}
                                        className="flex-1 min-w-[160px] px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm sm:text-xs text-slate-800 focus:outline-none focus:border-[#5C0612]"
                                      />
                                      <button
                                        type="submit"
                                        disabled={savingCommentEdit}
                                        className="px-3 py-1.5 bg-[#5C0612] hover:bg-[#42040B] disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
                                      >
                                        {savingCommentEdit ? 'Saving...' : 'Save'}
                                      </button>
                                      <button
                                        type="button"
                                        disabled={savingCommentEdit}
                                        onClick={() => {
                                          setEditingCommentId(null);
                                          setEditCommentText('');
                                        }}
                                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
                                      >
                                        Cancel
                                      </button>
                                    </form>
                                  ) : (
                                    <p className="text-slate-700 leading-relaxed break-words">
                                      {comment.comment_text}
                                    </p>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>

                        <form onSubmit={(e) => handleSendComment(e, item.feed_id)} className="flex gap-2">
                          <input
                            type="text"
                            value={commentInputs[item.feed_id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({ ...prev, [item.feed_id]: e.target.value }))
                            }
                            placeholder="Write a comment..."
                            maxLength={1000}
                            className="flex-1 min-w-0 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5C0612]/20"
                          />
                          <button
                            type="submit"
                            disabled={postingCommentId === item.feed_id}
                            className="px-4 py-2.5 bg-[#5C0612] hover:bg-[#42040B] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
                          >
                            {postingCommentId === item.feed_id ? '...' : 'Send'}
                          </button>
                        </form>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPagesCount > 1 && (
            <div className="flex justify-center items-center gap-1.5 pt-2 select-none font-mono text-xs">
              <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(Math.max(safeCurrentPage - 1, 1))}
                aria-label="Previous page"
                className="px-3.5 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-35 text-slate-700 font-bold"
              >
                &lt;
              </button>

              {Array.from({ length: totalPagesCount }, (_, idx) => idx + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-3.5 py-2 border rounded-xl font-bold transition-colors ${
                    safeCurrentPage === pageNumber
                      ? 'bg-[#5C0612] border-[#5C0612] text-white'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                disabled={safeCurrentPage === totalPagesCount}
                onClick={() => setCurrentPage(Math.min(safeCurrentPage + 1, totalPagesCount))}
                aria-label="Next page"
                className="px-3.5 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-35 text-slate-700 font-bold"
              >
                &gt;
              </button>
            </div>
          )}
        </div>

        {/* Desktop-Only Right Sidebar (hidden on mobile to keep mobile feed completely uncluttered) */}
        <aside className="hidden lg:block lg:col-span-5 xl:col-span-4 space-y-4 w-full text-left lg:sticky lg:top-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C0612]">
                Campus Overview
              </span>
              <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                CIT-U Animal Welfare Snapshot
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Live counts synced with the CIT-U clinic registry.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-500 uppercase block">On Campus</span>
                <span className="text-lg font-extrabold text-slate-900 tabular-nums mt-0.5 block">
                  {roamingPetsCount}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-500 uppercase block">Adoptable</span>
                <span className="text-lg font-extrabold text-amber-700 tabular-nums mt-0.5 block">
                  {petsAwaitingHomeCount}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-500 uppercase block">Sightings</span>
                <span className="text-lg font-extrabold text-slate-900 tabular-nums mt-0.5 block">
                  {sightingsCount}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-500">
              <p>Verified with your CIT-U institutional account (@cit.edu).</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-xs space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#5C0612] shrink-0" />
              <h5 className="font-bold text-slate-900 text-xs">Community Posting Guidelines</h5>
            </div>

            <ul className="space-y-2.5 text-slate-600 border-t border-slate-100 pt-3">
              <li>
                <strong className="text-slate-800 block">1. Include Specific Landmarks</strong>
                Share building names (GLE, NGE, RTL, SAL, P.E Area) so responders find animals quickly.
              </li>
              <li>
                <strong className="text-slate-800 block">2. Keep Discussions Helpful</strong>
                Focus comments on animal welfare, safety updates, and adoption inquiries.
              </li>
              <li>
                <strong className="text-slate-800 block">3. Protect Collar QR Tags</strong>
                Never remove or alter collar tags—they link directly to each animal&apos;s health profile.
              </li>
              <li>
                <strong className="text-slate-800 block">4. Report Urgent Sightings Early</strong>
                Spotted an injured or unfamiliar animal? Submit a report under the Report Sighting tab.
              </li>
            </ul>
          </div>

          <div className="bg-[#5C0612]/5 border border-[#5C0612]/15 rounded-2xl p-4 text-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C0612] block">
              Emergency Contact
            </span>
            <p className="text-slate-700 leading-relaxed">
              For bites, injuries, or aggressive animals, contact the{' '}
              <strong>CIT-U Medical-Dental Clinic (MDC)</strong> or Campus Security at{' '}
              <a href="tel:0322617741" className="font-mono font-bold text-[#5C0612] hover:underline">
                (032) 261-7741
              </a>
              .
            </p>
          </div>
        </aside>
      </div>

      {/* Delete Post Modal */}
      {itemToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => !deletingItem && setItemToDelete(null)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-sm w-full p-6 text-center animate-scale-up space-y-3"
          >
            <div className="w-12 h-12 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Delete Post</h3>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Are you sure you want to delete this post and its comments?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={deletingItem}
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingItem}
                onClick={handleExecuteDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl"
              >
                {deletingItem ? 'Deleting...' : 'Delete Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Comment Modal */}
      {commentToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => !deletingComment && setCommentToDelete(null)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-sm w-full p-6 text-center animate-scale-up space-y-3"
          >
            <h3 className="font-bold text-slate-900 text-sm">Delete Comment</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Are you sure you want to permanently remove this comment?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={deletingComment}
                onClick={() => setCommentToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingComment}
                onClick={handleExecuteCommentDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl"
              >
                {deletingComment ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxImg && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <button
            type="button"
            aria-label="Close image preview"
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 text-white bg-white/15 hover:bg-white/25 p-2 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxImg}
            alt="Full preview"
            className="max-w-full max-h-[88dvh] rounded-xl shadow-2xl object-contain animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
