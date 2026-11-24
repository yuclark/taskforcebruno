export function getLocalTodayIso() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const datePart = String(dateStr).trim().split('T')[0].split(' ')[0];
  const parts = datePart.split('-').map(Number);
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const fallback = new Date(dateStr);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function computeQuarantineReleaseDate(baseDateStr) {
  const base = parseLocalDate(baseDateStr) || new Date();
  const release = new Date(base.getTime() + 14 * 24 * 60 * 60 * 1000);
  const yyyy = release.getFullYear();
  const mm = String(release.getMonth() + 1).padStart(2, '0');
  const dd = String(release.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatFeedDate(rawTs) {
  if (!rawTs) return 'Recently';
  const d = new Date(rawTs);
  if (Number.isNaN(d.getTime())) return 'Recently';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCommentTime(rawTs) {
  if (!rawTs) return '';
  const d = new Date(rawTs);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatRelativeTime(isoString, nowMs = Date.now()) {
  if (!isoString) return 'Recently';
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return 'Recently';
  const diff = (nowMs - parsed.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return parsed.toLocaleDateString();
}
