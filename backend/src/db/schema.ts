import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  mode: text('mode', { enum: ['online', 'bot'] }).notNull(),
  botDifficulty: text('bot_difficulty', { enum: ['easy', 'medium', 'hard'] }),
  player1Id: uuid('player1_id')
    .notNull()
    .references(() => users.id),
  player2Id: uuid('player2_id').references(() => users.id),
  score1: integer('score1').notNull(),
  score2: integer('score2').notNull(),
  winner: text('winner', { enum: ['p1', 'p2', 'draw'] }).notNull(),
  endReason: text('end_reason', { enum: ['finished', 'forfeit', 'disconnect'] }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
