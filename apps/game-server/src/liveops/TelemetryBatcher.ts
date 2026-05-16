/**
 * TelemetryBatcher handles asynchronous, batch-based event tracking for LiveOps.
 * Designed to minimize Event Loop impact by buffering logs in RAM and flushing 
 * based on thresholds (batch size or time).
 * 
 * Adheres to requirements:
 * - Batch size: 100 events
 * - Flush interval: 10 seconds
 * - Asynchronous execution
 * - Non-blocking Event Loop
 */

export interface TelemetryEvent {
    event: string;
    timestamp: number;
    sessionId?: string;
    userId?: string;
    data: Record<string, any>;
}

class TelemetryBatcher {
    private queue: TelemetryEvent[] = [];
    private readonly MAX_BATCH_SIZE = 100;
    private readonly FLUSH_INTERVAL_MS = 10000;
    private flushTimer: NodeJS.Timeout | null = null;
    private isFlushing = false;

    constructor() {
        this.initFlushTimer();
    }

    /**
     * Records a telemetry event.
     * @param event Event name (e.g., 'Thermal Throttling Detected')
     * @param data Additional metadata for the event
     * @param context Optional session/user identification
     */
    public track(
        event: string, 
        data: Record<string, any> = {}, 
        context: { sessionId?: string; userId?: string } = {}
    ): void {
        const telemetryEvent: TelemetryEvent = {
            event,
            timestamp: Date.now(),
            sessionId: context.sessionId,
            userId: context.userId,
            data,
        };

        this.queue.push(telemetryEvent);

        // Immediate flush if threshold reached
        if (this.queue.length >= this.MAX_BATCH_SIZE) {
            // We don't await here to avoid blocking the caller
            this.flush().catch(err => {
                console.error("[TelemetryBatcher] Error during threshold-triggered flush:", err);
            });
        }
    }

    /**
     * Flushes the current queue to external providers (Datadog, Mixpanel, etc.)
     */
    public async flush(): Promise<void> {
        if (this.queue.length === 0 || this.isFlushing) {
            return;
        }

        this.isFlushing = true;

        // Take a snapshot of the current queue and clear it
        const batchToFlush = [...this.queue];
        this.queue = [];

        try {
            await this.sendToExternalProviders(batchToFlush);
        } catch (error) {
            // In case of failure, we log it. 
            // Depending on reliability requirements, we could re-enqueue or persist to disk.
            console.error(`[TelemetryBatcher] Failed to flush ${batchToFlush.length} events:`, error);
        } finally {
            this.isFlushing = false;
        }
    }

    /**
     * Mocked implementation of external provider integration.
     * In production, this would use axios/node-fetch to send data to Datadog/Mixpanel APIs.
     */
    private async sendToExternalProviders(batch: TelemetryEvent[]): Promise<void> {
        // Log to console for observability during development
        // console.debug(`[TelemetryBatcher] Flushing batch of ${batch.length} events to Datadog/Mixpanel...`);

        // Placeholder for Datadog / Mixpanel HTTP requests
        // In a real environment, this would be an async HTTP call:
        // await Promise.all([
        //    fetch(DATADOG_URL, { method: 'POST', body: JSON.stringify(batch) }),
        //    fetch(MIXPANEL_URL, { method: 'POST', body: JSON.stringify(batch) })
        // ]);

        return new Promise((resolve) => {
            // setImmediate ensures we yield to the event loop
            setImmediate(() => {
                resolve();
            });
        });
    }

    private initFlushTimer(): void {
        this.flushTimer = setInterval(() => {
            this.flush().catch(err => {
                console.error("[TelemetryBatcher] Error during interval-triggered flush:", err);
            });
        }, this.FLUSH_INTERVAL_MS);

        // Ensure the timer doesn't keep the process alive if everything else is finished
        if (this.flushTimer.unref) {
            this.flushTimer.unref();
        }
    }

    /**
     * Graceful shutdown: ensures pending events are flushed.
     */
    public async shutdown(): Promise<void> {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        await this.flush();
    }
}

// Export as singleton
export const telemetry = new TelemetryBatcher();
