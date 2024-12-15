import { MonitoringService } from './monitoring';

class MonitoringInstance {
  constructor() {
    this.isInitialized = false;
    this.service = new MonitoringService();
  }

  async initialize() {
    if (this.isInitialized) {
      console.log('Monitoring service already initialized');
      return;
    }

    try {
      await this.service.startMonitoring();
      this.isInitialized = true;
      console.log('Monitoring service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize monitoring service:', error);
      throw error;
    }
  }

  async stop() {
    if (!this.isInitialized) return;
    
    await this.service.stopAllMonitoring();
    this.isInitialized = false;
  }

  isRunning() {
    return this.isInitialized;
  }
}

export const monitoringInstance = new MonitoringInstance();