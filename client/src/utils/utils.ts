export const formatDate = (dateString: string | Date | null) => {
  try {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return format(date, 'MMM d, yyyy');
  } catch {
    return '-';
  }
};