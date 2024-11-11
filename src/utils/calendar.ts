export const createGoogleCalendarUrl = (
  title: string,
  description: string,
  startDate: string,
  startTime?: string,
  endTime?: string,
  location?: string
) => {
  // 日時のフォーマット
  const start = startTime 
    ? `${startDate.replace(/-/g, '')}T${startTime.replace(/:/g, '')}00`
    : startDate.replace(/-/g, '');
  const end = endTime 
    ? `${startDate.replace(/-/g, '')}T${endTime.replace(/:/g, '')}00`
    : startDate.replace(/-/g, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description,
    dates: `${start}/${end}`,
    ...(location && { location })
  });
  return `https://calendar.google.com/calendar/render?${params}`;
};

export const createYahooCalendarUrl = (
  title: string,
  description: string,
  startDate: string,
  startTime?: string,
  endTime?: string,
  location?: string
) => {
  // 日時のフォーマット
  const start = startTime 
    ? `${startDate.replace(/-/g, '')}T${startTime.replace(/:/g, '')}00`
    : startDate.replace(/-/g, '');
  const end = endTime 
    ? `${startDate.replace(/-/g, '')}T${endTime.replace(/:/g, '')}00`
    : startDate.replace(/-/g, '');

  const params = new URLSearchParams({
    v: '60',
    TITLE: title,
    DESC: description,
    ST: start,
    ET: end,
    ...(location && { in_loc: location })
  });
  return `https://calendar.yahoo.com/?${params}`;
};