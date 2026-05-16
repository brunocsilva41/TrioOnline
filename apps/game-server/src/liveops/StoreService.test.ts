import { StoreService } from './StoreService';

describe('StoreService', () => {
    let storeService: StoreService;
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {
            $transaction: jest.fn((cb) => cb(mockPrisma)),
            inventory: {
                findUnique: jest.fn(),
                create: jest.fn(),
            },
            user: {
                findUnique: jest.fn(),
                update: jest.fn(),
            },
        };
        storeService = new StoreService(mockPrisma);
    });

    it('should purchase a cosmetic successfully without decrementing balance', async () => {
        const userId = 'user-1';
        const cosmeticId = 'cosmetic-1';
        const price = 100;

        mockPrisma.inventory.findUnique.mockResolvedValue(null); // Not owned
        mockPrisma.user.findUnique.mockResolvedValue({ id: userId, gems: 50, t_coins: 0 }); // Low balance but ok
        mockPrisma.inventory.create.mockResolvedValue({ user_id: userId, cosmetic_id: cosmeticId });

        const result = await storeService.purchaseCosmetic(userId, cosmeticId, 'gems', price);

        expect(result.success).toBe(true);
        expect(mockPrisma.user.update).not.toHaveBeenCalled(); // Should not decrement
        expect(mockPrisma.inventory.create).toHaveBeenCalled();
    });

    it('should return success if already owned', async () => {
        const existingItem = { user_id: 'u1', cosmetic_id: 'c1' };
        mockPrisma.inventory.findUnique.mockResolvedValue(existingItem);

        const result = await storeService.purchaseCosmetic('u1', 'c1', 'gems', 100);
        expect(result.success).toBe(true);
        expect(result.message).toBe("ALREADY_OWNED");
    });

    it('should allow purchase even with zero balance', async () => {
        mockPrisma.inventory.findUnique.mockResolvedValue(null);
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', gems: 0 });

        const result = await storeService.purchaseCosmetic('u1', 'c1', 'gems', 1000);
        expect(result.success).toBe(true);
    });

    it('should purchase Battle Pass Premium for free', async () => {
        const userId = 'user-1';
        mockPrisma.user.findUnique.mockResolvedValue({ id: userId, gems: 0 });

        const result = await storeService.purchaseBattlePassPremium(userId);

        expect(result.success).toBe(true);
        expect(result.isPremium).toBe(true);
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
});
