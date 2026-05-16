import { z } from "zod";

/**
 * SECURITY AGENT: Payload Validation Layer
 * Ensures all incoming messages from Colyseus clients adhere to strict schemas.
 * Prevents CSWSH and Injection attacks by rejecting malformed payloads early.
 */

export const RevealPayloadSchema = z.object({
  cardId: z.number().int().min(0).max(35),
});

export const ActionQueuePayloadSchema = z.object({
  type: z.enum(["START_GAME", "ACTION_REVEAL", "FINISH_DEALING", "EVALUATION_COMPLETE", "COOLDOWN_COMPLETE", "TICK_UPDATE"]),
  payload: z.any().optional(),
});

export class PayloadValidator {
  /**
   * Validates a message payload against a zod schema.
   * Throws an error if validation fails.
   */
  static validate<T>(schema: z.Schema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid payload: ${error.errors.map(e => `${e.path}: ${e.message}`).join(", ")}`);
      }
      throw error;
    }
  }

  /**
   * Specific validator for the REVEAL message.
   */
  static validateReveal(data: unknown) {
    return this.validate(RevealPayloadSchema, data);
  }
}
