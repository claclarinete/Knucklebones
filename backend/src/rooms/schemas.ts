import { z } from 'zod';
import { NICKNAME_MAX_LENGTH, NICKNAME_PATTERN } from './nickname.js';

// Validação dos dados recebidos do cliente, conforme docs/contrato-socket.md.

/** 6 caracteres sem 0, O, 1 e I, para não confundir na leitura. */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 6;

export const nicknameSchema = z
  .string()
  .trim()
  .max(NICKNAME_MAX_LENGTH)
  .regex(NICKNAME_PATTERN)
  .optional();

export const difficultySchema = z.enum(['easy', 'medium', 'hard']);

/** A entrada ignora maiúsculas e minúsculas. */
export const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(ROOM_CODE_LENGTH)
  .regex(/^[ABCDEFGHJKLMNPQRSTUVWXYZ2-9]+$/);

export const queueJoinSchema = z.object({ nickname: nicknameSchema }).default({});

export const roomCreateSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('online'), nickname: nicknameSchema }),
  z.object({ mode: z.literal('bot'), difficulty: difficultySchema, nickname: nicknameSchema }),
]);

export const roomJoinSchema = z.object({ code: roomCodeSchema, nickname: nicknameSchema });

export const gameMoveSchema = z.object({ column: z.literal([0, 1, 2]) });

export const gameRejoinSchema = z.object({
  code: roomCodeSchema,
  playerToken: z.string().min(1).max(128),
});

export type Difficulty = z.infer<typeof difficultySchema>;
export type QueueJoinPayload = z.infer<typeof queueJoinSchema>;
export type RoomCreatePayload = z.infer<typeof roomCreateSchema>;
export type RoomJoinPayload = z.infer<typeof roomJoinSchema>;
export type GameMovePayload = z.infer<typeof gameMoveSchema>;
export type GameRejoinPayload = z.infer<typeof gameRejoinSchema>;
