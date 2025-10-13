/**
 * Synchronized Market Data Update Manager
 *
 * This manager ensures all market data updates happen at the top of each minute (:00 seconds)
 * to prevent request spamming and provide consistent updates across the application.
 */

interface SyncSubscriber {
  id: string;
  callback: () => void;
}

class MarketSyncManager {
  private subscribers: Map<string, SyncSubscriber> = new Map();
  private syncTimer: NodeJS.Timeout | null = null;
  private intervalTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    // Start the sync manager when first created
    this.start();
  }

  /**
   * Calculate milliseconds until the next minute (:00 seconds)
   */
  private getMillisecondsUntilNextMinute(): number {
    const now = new Date();
    const seconds = now.getSeconds();
    const milliseconds = now.getMilliseconds();

    // Calculate time until next :00 second
    const msUntilNextMinute = (60 - seconds) * 1000 - milliseconds;

    return msUntilNextMinute;
  }

  /**
   * Start the synchronized update cycle
   */
  private start() {
    if (this.isRunning) return;

    this.isRunning = true;

    // Calculate time until next minute
    const msUntilNextMinute = this.getMillisecondsUntilNextMinute();

    console.log(`Market sync starting in ${Math.floor(msUntilNextMinute / 1000)} seconds (at :00)`);

    // Set initial timeout to sync at the next :00
    this.syncTimer = setTimeout(() => {
      // Trigger all subscribers
      this.notifySubscribers();

      // Set up interval for every minute at :00
      this.intervalTimer = setInterval(() => {
        const now = new Date();
        console.log(`Market sync triggered at ${now.toLocaleTimeString()}`);
        this.notifySubscribers();
      }, 60000); // Every 60 seconds
    }, msUntilNextMinute);
  }

  /**
   * Stop the synchronized update cycle
   */
  private stop() {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }

    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }

    this.isRunning = false;
  }

  /**
   * Subscribe to synchronized updates
   */
  subscribe(id: string, callback: () => void): () => void {
    const subscriber: SyncSubscriber = { id, callback };
    this.subscribers.set(id, subscriber);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(id);

      // If no more subscribers, stop the sync
      if (this.subscribers.size === 0) {
        this.stop();
      }
    };
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers() {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber.callback();
      } catch (error) {
        console.error(`Error in market sync subscriber ${subscriber.id}:`, error);
      }
    });
  }

  /**
   * Get the next sync time
   */
  getNextSyncTime(): Date {
    const now = new Date();
    const nextMinute = new Date(now);
    nextMinute.setSeconds(0, 0);
    nextMinute.setMinutes(nextMinute.getMinutes() + 1);
    return nextMinute;
  }

  /**
   * Get seconds until next sync
   */
  getSecondsUntilNextSync(): number {
    return Math.floor(this.getMillisecondsUntilNextMinute() / 1000);
  }
}

// Export singleton instance
export const marketSyncManager = new MarketSyncManager();