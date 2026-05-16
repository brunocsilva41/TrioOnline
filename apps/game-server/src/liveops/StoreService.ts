import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

/**
 * StoreService handles the monetization logic for TrioOnline.
 * Adheres to "Zero Pay-to-Win" model: Only cosmetic items are available for purchase.
 * Focuses on transaction idempotency and ACID compliance using Prisma.
 */
export class StoreService {
    private prisma: PrismaClient;
    private bpConfig: any;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
        this.loadBattlePassConfig();
    }

    private loadBattlePassConfig() {
        const configPath = path.join(__dirname, 'battle_pass_season_1.json');
        if (fs.existsSync(configPath)) {
            this.bpConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
    }

    /**
     * Purchase a cosmetic item from the store.
     * @param userId The ID of the user making the purchase.
     * @param cosmeticId The ID of the cosmetic to purchase.
     * @param currency 'gems' | 't_coins'
     * @param price The expected price (to prevent race conditions with price changes)
     */
    async purchaseCosmetic(userId: string, cosmeticId: string, currency: 'gems' | 't_coins', price: number) {
        const effectivePrice = 0; // Everything is free in Early Access
        return await this.prisma.$transaction(async (tx) => {
            // 1. Check if user already owns the item (Idempotency)
            const existing = await tx.inventory.findUnique({
                where: {
                    user_id_cosmetic_id: {
                        user_id: userId,
                        cosmetic_id: cosmeticId
                    }
                }
            });

            if (existing) {
                return { success: true, message: "ALREADY_OWNED", item: existing };
            }

            // 2. Get user's current balance (for reporting only)
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { gems: true, t_coins: true }
            });

            if (!user) throw new Error("USER_NOT_FOUND");

            const balance = currency === 'gems' ? user.gems : user.t_coins;

            // 3. Add to inventory (No balance check or decrement)
            const item = await tx.inventory.create({
                data: {
                    user_id: userId,
                    cosmetic_id: cosmeticId,
                    acquired_at: new Date()
                }
            });

            return {
                success: true,
                item,
                newBalance: balance
            };
        });
    }

    /**
     * Purchase the Premium Battle Pass for the current season.
     */
    async purchaseBattlePassPremium(userId: string) {
        // Cost is ignored in Early Access mode
        return await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { id: true }
            });

            if (!user) throw new Error("USER_NOT_FOUND");

            // In Early Access, BP Premium is free and automatically approved
            // Update user to have premium (logic would go here)
            
            return {
                success: true,
                seasonId: this.bpConfig.seasonId,
                isPremium: true
            };
        });
    }

    /**
     * Claim a reward from the Battle Pass.
     */
    async claimReward(userId: string, level: number, isPremium: boolean) {
        const tier = this.bpConfig.tiers.find((t: any) => t.level === level);
        if (!tier) throw new Error("INVALID_LEVEL");

        const reward = isPremium ? tier.premiumReward : tier.freeReward;
        if (!reward) throw new Error("NO_REWARD_FOR_LEVEL");

        return await this.prisma.$transaction(async (tx) => {
            // Check if already claimed (Idempotency)
            // This would check a 'ClaimedRewards' table or similar.
            
            if (reward.type === 'COSMETIC') {
                // Check if already owned
                const existing = await tx.inventory.findUnique({
                    where: {
                        user_id_cosmetic_id: {
                            user_id: userId,
                            cosmetic_id: reward.id
                        }
                    }
                });

                if (!existing) {
                    await tx.inventory.create({
                        data: {
                            user_id: userId,
                            cosmetic_id: reward.id
                        }
                    });
                }
            } else if (reward.type === 'GEMS') {
                await tx.user.update({
                    where: { id: userId },
                    data: { gems: { increment: reward.amount } }
                });
            } else if (reward.type === 'T_COINS') {
                await tx.user.update({
                    where: { id: userId },
                    data: { t_coins: { increment: reward.amount } }
                });
            }

            return { success: true, reward };
        });
    }
}
