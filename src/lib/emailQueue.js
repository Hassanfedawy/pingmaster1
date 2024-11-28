class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.retryDelay = 5000; // 5 seconds
    this.maxRetries = 3;
  }

  addToQueue(emailData) {
    this.queue.push({
      ...emailData,
      retries: 0,
      addedAt: new Date(),
    });
    
    if (!this.processing) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const emailData = this.queue[0];

    try {
      await this.sendEmail(emailData);
      this.queue.shift(); // Remove the email from queue after successful sending
      console.log(`Email sent successfully to ${emailData.to}`);
    } catch (error) {
      console.error(`Error sending email to ${emailData.to}:`, error);
      
      if (emailData.retries < this.maxRetries) {
        emailData.retries++;
        // Move to the end of the queue for retry
        this.queue.shift();
        this.queue.push(emailData);
        
        // Wait before processing next email
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      } else {
        console.error(`Max retries reached for email to ${emailData.to}`);
        this.queue.shift(); // Remove from queue after max retries
      }
    }

    // Process next email in queue
    setTimeout(() => this.processQueue(), 1000);
  }

  async sendEmail(emailData) {
    const { transporter } = await import('./notifications');
    await transporter.sendMail(emailData);
  }

  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      oldestEmail: this.queue[0]?.addedAt || null,
    };
  }
}

// Create a singleton instance
const emailQueue = new EmailQueue();
export default emailQueue;
