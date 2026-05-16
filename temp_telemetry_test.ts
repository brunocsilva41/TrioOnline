import { telemetry } from './apps/game-server/src/liveops/TelemetryBatcher';

async function testTelemetry() {
    console.log("Starting telemetry test...");

    // Track 105 events (should trigger 1 flush of 100 events, 5 remaining)
    for (let i = 0; i < 105; i++) {
        telemetry.track('test_event', { index: i });
    }

    console.log("Tracked 105 events. Expecting 1 flush...");
    
    // Wait a bit to allow async flush
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log("Waiting 11 seconds for interval flush of remaining 5 events...");
    await new Promise(resolve => setTimeout(resolve, 11000));

    await telemetry.shutdown();
    console.log("Telemetry shutdown complete.");
}

testTelemetry().catch(console.error);
