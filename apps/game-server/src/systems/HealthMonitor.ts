import { Registry, Gauge, collectDefaultMetrics } from 'prom-client';

/**
 * HealthMonitor System
 * Responsible for collecting and exposing system-level and room-level metrics.
 * Targets 99.9% uptime by providing visibility into 'Zombie' rooms and Event Loop lag.
 */
export class HealthMonitor {
    private static instance: HealthMonitor;
    private registry: Registry;
    
    public roomCpuUsage: Gauge<string>;
    public eventLoopLag: Gauge<string>;
    public roomPlayerCount: Gauge<string>;
    public roomMemoryUsage: Gauge<string>;

    private constructor() {
        this.registry = new Registry();
        
        // Collect default Node.js metrics (CPU, Memory, etc.)
        collectDefaultMetrics({ register: this.registry, prefix: 'node_' });

        this.roomCpuUsage = new Gauge({
            name: 'game_room_cpu_usage_seconds',
            help: 'CPU time spent processing room logic (last tick)',
            labelNames: ['roomId'],
            registers: [this.registry]
        });

        this.eventLoopLag = new Gauge({
            name: 'game_event_loop_lag_seconds',
            help: 'Latency of the Node.js event loop in seconds',
            registers: [this.registry]
        });

        this.roomPlayerCount = new Gauge({
            name: 'game_room_players_count',
            help: 'Current number of players in the room',
            labelNames: ['roomId'],
            registers: [this.registry]
        });

        this.roomMemoryUsage = new Gauge({
            name: 'game_room_memory_usage_bytes',
            help: 'Estimated memory usage of the room object',
            labelNames: ['roomId'],
            registers: [this.registry]
        });

        this.startLagMonitoring();
    }

    public static getInstance(): HealthMonitor {
        if (!HealthMonitor.instance) {
            HealthMonitor.instance = new HealthMonitor();
        }
        return HealthMonitor.instance;
    }

    /**
     * Measures event loop lag by scheduling a timer and measuring the delay in execution.
     */
    private startLagMonitoring() {
        let lastTime = process.hrtime.bigint();
        setInterval(() => {
            const currentTime = process.hrtime.bigint();
            // Expected interval is 1000ms. Lag is (actual - expected)
            const delta = Number(currentTime - lastTime) / 1e9;
            const lag = Math.max(0, delta - 1);
            this.eventLoopLag.set(lag);
            lastTime = currentTime;
        }, 1000).unref();
    }

    /**
     * Returns the metrics in Prometheus format.
     */
    public async getMetrics(): Promise<string> {
        return await this.registry.metrics();
    }

    /**
     * Cleans up metrics for a disposed room.
     */
    public removeRoomMetrics(roomId: string) {
        this.roomCpuUsage.remove(roomId);
        this.roomPlayerCount.remove(roomId);
        this.roomMemoryUsage.remove(roomId);
    }
}

export const healthMonitor = HealthMonitor.getInstance();
