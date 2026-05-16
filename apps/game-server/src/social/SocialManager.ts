import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

/**
 * SocialManager handles friendships, friend requests, and invite tokens.
 * Persists data using Prisma for durability.
 */
export class SocialManager {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    /**
     * Send a friend request from one user to another.
     */
    async sendFriendRequest(senderId: string, receiverId: string) {
        if (senderId === receiverId) throw new Error("Cannot add yourself as friend");

        return await this.prisma.friendRequest.upsert({
            where: {
                sender_id_receiver_id: {
                    sender_id: senderId,
                    receiver_id: receiverId
                }
            },
            update: { status: "PENDING" },
            create: {
                sender_id: senderId,
                receiver_id: receiverId,
                status: "PENDING"
            }
        });
    }

    /**
     * Respond to a friend request (Accept/Decline).
     */
    async respondToFriendRequest(requestId: string, status: "ACCEPTED" | "DECLINED") {
        const request = await this.prisma.friendRequest.update({
            where: { id: requestId },
            data: { status }
        });

        if (status === "ACCEPTED") {
            // Create bidirectional friendship
            await this.prisma.$transaction([
                this.prisma.friendship.create({
                    data: { user_id_1: request.sender_id, user_id_2: request.receiver_id }
                }),
                this.prisma.friendship.create({
                    data: { user_id_1: request.receiver_id, user_id_2: request.sender_id }
                })
            ]);
        }

        return request;
    }

    /**
     * Get all friends for a user.
     */
    async getFriends(userId: string) {
        return await this.prisma.friendship.findMany({
            where: { user_id_1: userId },
            include: {
                user_2: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true,
                        mmr_rating: true
                    }
                }
            }
        });
    }

    /**
     * Generates a unique invitation token for a private room.
     * DOC-ID: [LINK_INVITE_SYSTEM]
     */
    generateInviteToken(roomId: string, hostUserId: string): string {
        const payload = {
            roomId,
            hostUserId,
            expiresAt: Date.now() + 3600000 // 1 hour expiration
        };
        // In a real scenario, sign this with a secret
        return Buffer.from(JSON.stringify(payload)).toString('base64');
    }

    /**
     * Decodes and validates an invite token.
     */
    validateInviteToken(token: string): { roomId: string; hostUserId: string } | null {
        try {
            const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
            if (decoded.expiresAt < Date.now()) return null;
            return { roomId: decoded.roomId, hostUserId: decoded.hostUserId };
        } catch (e) {
            return null;
        }
    }
}
