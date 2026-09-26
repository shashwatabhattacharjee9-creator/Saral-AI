import { extractionWorker, ScanProcessingJob } from './extractionWorker';

class ScanQueue {
  private queue: ScanProcessingJob[] = [];
  private isProcessing = false;

  async enqueue(job: ScanProcessingJob): Promise<void> {
    this.queue.push(job);
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const job = this.queue.shift();
    if (job) {
      try {
        await extractionWorker.processScan(job);
      } catch (err) {
        console.error('Queue job processing error:', err);
      }
    }

    this.isProcessing = false;
    if (this.queue.length > 0) {
      setTimeout(() => this.processNext(), 50);
    }
  }

  getDepth(): number {
    return this.queue.length;
  }
}

export const scanQueue = new ScanQueue();
