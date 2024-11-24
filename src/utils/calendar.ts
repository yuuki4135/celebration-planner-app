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

export const createICSFile = (
  title: string,
  description: string,
  startDate: string,
  startTime?: string,
  endTime?: string,
  location?: string
) => {
  // 日時のフォーマット
  const start = startTime 
    ? `${startDate.replace(/-/g, '')}T${startTime.replace(/:/g, '')}00Z`
    : `${startDate.replace(/-/g, '')}`;
  const end = endTime 
    ? `${startDate.replace(/-/g, '')}T${endTime.replace(/:/g, '')}00Z`
    : `${startDate.replace(/-/g, '')}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//hacksw/handcal//NONSGML v1.0//EN',
    'BEGIN:VEVENT',
    `UID:${new Date().getTime()}@example.com`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, '')}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    location ? `LOCATION:${location}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  return url;
};
