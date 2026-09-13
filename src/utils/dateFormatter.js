/**
 * Global Date & Time Formatter Utility
 * Standard format:
 * - Date only: "August 02, 2026"
 * - Date & Time: "August 02, 2026, 11:30 pm"
 */

export function formatDate(val) {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "—";
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    const year = d.getFullYear();

    return `${month} ${day}, ${year}`;
  } catch {
    return "—";
  }
}

export function formatDateTime(val) {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "—";

    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    return `${month} ${day}, ${year}, ${timeStr}`;
  } catch {
    return "—";
  }
}

export function formatTime(val) {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "—";

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  } catch {
    return "—";
  }
}

export default { formatDate, formatDateTime, formatTime };

