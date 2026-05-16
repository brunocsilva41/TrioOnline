import { PrismaClient } from '@prisma/client';
import { telemetry } from './TelemetryBatcher';

/**
 * RetentionTracker handles the recording of user login events specifically
 * for long-term retention analysis (D1, D7, D30).
 */
export class RetentionTracker {
    constructor(private prisma: PrismaClient) {}

    /**
     * Records a user login for retention tracking.
     * It ensures only one login event per user per day is persisted to the database
     * to optimize storage while maintaining accurate retention metrics.
     * 
     * @param userId The UUID of the user
     */
    public async recordLogin(userId: string): Promise<void> {
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setUTCHours(23, 59, 59, 999);

        try {
            // Check if a login for this user already exists today
            const existingLogin = await this.prisma.userLogin.findFirst({
                where: {
                    user_id: userId,
                    logged_at: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            });

            if (!existingLogin) {
                await this.prisma.userLogin.create({
                    data: {
                        user_id: userId,
                        logged_at: new Date(),
                    },
                });

                // Track in telemetry for additional business intelligence (Mixpanel/Datadog)
                telemetry.track('user_login_recorded', { 
                    method: 'retention_tracker',
                    timestamp: new Date().toISOString()
                }, { userId });
            }
        } catch (error) {
            console.error(`[RetentionTracker] Error recording login for user ${userId}:`, error);
        }
    }
}
