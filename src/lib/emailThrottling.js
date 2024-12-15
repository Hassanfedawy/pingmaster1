class EmailThrottler {
    constructor() {
      this.throttleMap = new Map();
      this.THROTTLE_DURATION = 15 * 60 * 1000; // 15 minutes
    }
  
    canSendEmail(urlId, status) {
      const key = `${urlId}_${status}`;
      const now = Date.now();
      const lastSent = this.throttleMap.get(key);
  
      if (!lastSent || (now - lastSent) >= this.THROTTLE_DURATION) {
        this.throttleMap.set(key, now);
        return true;
      }
  
      return false;
    }
  
    clearThrottle(urlId) {
      for (const [key] of this.throttleMap) {
        if (key.startsWith(urlId)) {
          this.throttleMap.delete(key);
        }
      }
    }
  }
  
  export const emailThrottler = new EmailThrottler();