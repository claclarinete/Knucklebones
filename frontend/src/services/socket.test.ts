import { describe, expect, it } from 'vitest';
import { createSocket } from './socket';

describe('createSocket', () => {
  it('não conecta automaticamente', () => {
    const socket = createSocket();

    expect(socket.connected).toBe(false);
  });
});
