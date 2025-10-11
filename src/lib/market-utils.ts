/**
 * Market utilities for checking market status, hours, etc.
 */

/**
 * Check if the US stock market is currently open
 * Markets are open Monday-Friday, 9:30 AM - 4:00 PM Eastern Time
 *
 * @returns true if market is currently open, false otherwise
 */
export function isMarketOpen(): boolean {
  const now = new Date();

  // Convert to Eastern Time
  // Create a date in ET timezone
  const etTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));

  const day = etTime.getDay();
  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();

  // Check if weekend (Saturday = 6, Sunday = 0)
  if (day === 0 || day === 6) {
    return false;
  }

  // Convert current time to minutes since midnight for easier comparison
  const currentMinutes = hours * 60 + minutes;

  // Market open: 9:30 AM ET = 570 minutes
  const marketOpen = 9 * 60 + 30;

  // Market close: 4:00 PM ET = 960 minutes
  const marketClose = 16 * 60;

  // Check if within market hours
  return currentMinutes >= marketOpen && currentMinutes < marketClose;
}

/**
 * Check if currently in extended trading hours (pre-market or after-hours)
 * Pre-market: 4:00 AM - 9:30 AM ET
 * After-hours: 4:00 PM - 8:00 PM ET
 *
 * @returns true if in extended hours, false otherwise
 */
export function isExtendedHours(): boolean {
  const now = new Date();

  // Convert to Eastern Time
  const etTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));

  const day = etTime.getDay();
  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();

  // Check if weekend
  if (day === 0 || day === 6) {
    return false;
  }

  // Convert current time to minutes since midnight
  const currentMinutes = hours * 60 + minutes;

  // Pre-market: 4:00 AM - 9:30 AM ET
  const preMarketStart = 4 * 60;
  const preMarketEnd = 9 * 60 + 30;

  // After-hours: 4:00 PM - 8:00 PM ET
  const afterHoursStart = 16 * 60;
  const afterHoursEnd = 20 * 60;

  // Check if in pre-market or after-hours
  return (currentMinutes >= preMarketStart && currentMinutes < preMarketEnd) ||
         (currentMinutes >= afterHoursStart && currentMinutes < afterHoursEnd);
}

/**
 * Get market status string for display
 * @returns "Open", "Closed", "Pre-Market", or "After-Hours"
 */
export function getMarketStatus(): 'Open' | 'Closed' | 'Pre-Market' | 'After-Hours' {
  if (isMarketOpen()) {
    return 'Open';
  }

  if (isExtendedHours()) {
    const now = new Date();
    const etTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const hours = etTime.getHours();

    // If before 9:30 AM, it's pre-market
    if (hours < 9 || (hours === 9 && etTime.getMinutes() < 30)) {
      return 'Pre-Market';
    }
    // Otherwise it's after-hours
    return 'After-Hours';
  }

  return 'Closed';
}

/**
 * Get the next market open time
 * @returns Date object representing next market open
 */
export function getNextMarketOpen(): Date {
  const now = new Date();
  const etTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));

  let nextOpen = new Date(etTime);

  // Set to 9:30 AM
  nextOpen.setHours(9, 30, 0, 0);

  // If it's already past 9:30 AM today, move to next day
  if (etTime > nextOpen) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }

  // Skip weekends
  while (nextOpen.getDay() === 0 || nextOpen.getDay() === 6) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }

  return nextOpen;
}

/**
 * Format time until market open/close
 * @returns Formatted string like "Opens in 2h 30m" or "Closes in 45m"
 */
export function getMarketTimingMessage(): string {
  const status = getMarketStatus();
  const now = new Date();

  if (status === 'Open') {
    // Calculate time until close (4:00 PM ET)
    const etTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const closeTime = new Date(etTime);
    closeTime.setHours(16, 0, 0, 0);

    const msUntilClose = closeTime.getTime() - etTime.getTime();
    const minutesUntilClose = Math.floor(msUntilClose / 1000 / 60);

    if (minutesUntilClose <= 60) {
      return `Closes in ${minutesUntilClose}m`;
    }

    const hoursUntilClose = Math.floor(minutesUntilClose / 60);
    const remainingMinutes = minutesUntilClose % 60;
    return `Closes in ${hoursUntilClose}h ${remainingMinutes}m`;
  }

  // Calculate time until next open
  const nextOpen = getNextMarketOpen();
  const msUntilOpen = nextOpen.getTime() - now.getTime();
  const minutesUntilOpen = Math.floor(msUntilOpen / 1000 / 60);

  if (minutesUntilOpen <= 60) {
    return `Opens in ${minutesUntilOpen}m`;
  }

  if (minutesUntilOpen < 24 * 60) {
    const hoursUntilOpen = Math.floor(minutesUntilOpen / 60);
    const remainingMinutes = minutesUntilOpen % 60;
    return `Opens in ${hoursUntilOpen}h ${remainingMinutes}m`;
  }

  // More than a day away
  const daysUntilOpen = Math.floor(minutesUntilOpen / 60 / 24);
  if (daysUntilOpen === 1) {
    return 'Opens Monday';
  }

  return `Opens in ${daysUntilOpen} days`;
}