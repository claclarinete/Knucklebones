import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { matches, users } from '../src/db/schema.js';

describe('schema do banco', () => {
  const client = new PGlite();
  const db = drizzle(client);

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: './drizzle' });
  });

  afterAll(async () => {
    await client.close();
  });

  it('salva um usuário e uma partida contra o bot', async () => {
    const [user] = await db
      .insert(users)
      .values({ username: 'jogador', passwordHash: 'hash' })
      .returning();

    const [match] = await db
      .insert(matches)
      .values({
        mode: 'bot',
        botDifficulty: 'easy',
        player1Id: user!.id,
        score1: 42,
        score2: 30,
        winner: 'p1',
        endReason: 'finished',
      })
      .returning();

    expect(match!.player2Id).toBeNull();
    expect(match!.endedAt).toBeInstanceOf(Date);
  });

  it('não permite nomes de usuário repetidos', async () => {
    await expect(
      db.insert(users).values({ username: 'jogador', passwordHash: 'outro' }),
    ).rejects.toThrow();
  });
});
