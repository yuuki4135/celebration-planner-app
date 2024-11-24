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

export const createICSFile = ((
  title: string,
  description: string,
  date: string,
  startTime?: string,
  endTime?: string
): string => {
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//hacksw/handcal//NONSGML v1.0//EN
BEGIN:VEVENT
SUMMARY:${title}
DESCRIPTION:${description}
DTSTART:${date.replace(/-/g, '')}${startTime ? 'T' + startTime.replace(/:/g, '') + '00' : ''}
DTEND:${date.replace(/-/g, '')}${endTime ? 'T' + endTime.replace(/:/g, '') + '00' : ''}
END:VEVENT
END:VCALENDAR`;

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
});
