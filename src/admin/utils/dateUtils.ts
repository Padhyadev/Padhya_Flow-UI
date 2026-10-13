export function formatDate(dateString: string | Date | null | undefined): string {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';

        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const yyyy = date.getFullYear();

        return `${dd}-${mm}-${yyyy}`;
    } catch {
        return '-';
    }
}

export function formatDateTime(dateString: string | Date | null | undefined): string {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';

        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const yyyy = date.getFullYear();

        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;

        return `${dd}-${mm}-${yyyy} ${hours}:${minutes} ${ampm}`;
    } catch {
        return '-';
    }
}

/**
 * Convert date string to YYYY-MM-DD format for input[type="date"] fields
 * Handles timezone issues by using UTC or parsing the date string directly
 */
export function toInputDate(dateString: string | Date | null | undefined): string {
    if (!dateString) return '';

    try {
        // If it's already in YYYY-MM-DD format, return as is
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }

        // Parse the date string
        const dateStr = typeof dateString === 'string' ? dateString : dateString.toISOString();

        // Extract date part from ISO string (YYYY-MM-DDTHH:mm:ss)
        if (dateStr.includes('T')) {
            return dateStr.split('T')[0];
        }

        // Fallback: create date and format
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';

        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');

        return `${yyyy}-${mm}-${dd}`;
    } catch {
        return '';
    }
}
