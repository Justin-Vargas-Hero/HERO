// Common timezones for user selection
export const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00' },
  // Americas
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: '-05:00' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: '-06:00' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: '-07:00' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: '-08:00' },
  { value: 'America/Toronto', label: 'Toronto', offset: '-05:00' },
  { value: 'America/Mexico_City', label: 'Mexico City', offset: '-06:00' },
  { value: 'America/Sao_Paulo', label: 'São Paulo', offset: '-03:00' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires', offset: '-03:00' },
  // Europe
  { value: 'Europe/London', label: 'London (GMT)', offset: '+00:00' },
  { value: 'Europe/Paris', label: 'Paris/Berlin/Rome', offset: '+01:00' },
  { value: 'Europe/Moscow', label: 'Moscow', offset: '+03:00' },
  { value: 'Europe/Istanbul', label: 'Istanbul', offset: '+03:00' },
  // Asia
  { value: 'Asia/Dubai', label: 'Dubai', offset: '+04:00' },
  { value: 'Asia/Karachi', label: 'Karachi', offset: '+05:00' },
  { value: 'Asia/Kolkata', label: 'Mumbai/New Delhi', offset: '+05:30' },
  { value: 'Asia/Bangkok', label: 'Bangkok', offset: '+07:00' },
  { value: 'Asia/Singapore', label: 'Singapore', offset: '+08:00' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong', offset: '+08:00' },
  { value: 'Asia/Shanghai', label: 'Beijing/Shanghai', offset: '+08:00' },
  { value: 'Asia/Seoul', label: 'Seoul', offset: '+09:00' },
  { value: 'Asia/Tokyo', label: 'Tokyo', offset: '+09:00' },
  // Pacific
  { value: 'Australia/Sydney', label: 'Sydney', offset: '+10:00' },
  { value: 'Australia/Melbourne', label: 'Melbourne', offset: '+10:00' },
  { value: 'Pacific/Auckland', label: 'Auckland', offset: '+12:00' },
];

// Helper to get user's browser timezone
export function getUserTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Check if it's in our list
    if (TIMEZONES.find(t => t.value === tz)) {
      return tz;
    }
  } catch (e) {
    console.warn('Could not detect user timezone');
  }
  return 'UTC'; // Default to UTC
}

// Convert datetime from one timezone to another
export function convertTimezone(datetime: string, fromTz: string, toTz: string): Date {
  // If converting from/to UTC, handle specially
  if (fromTz === 'UTC') {
    return new Date(datetime + 'Z');
  }

  // For other timezones, we need more complex conversion
  // This is a simplified version - for production, use a library like date-fns-tz
  return new Date(datetime);
}

// Format date in user's timezone
export function formatInTimezone(date: Date, timezone: string): string {
  return date.toLocaleString('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}