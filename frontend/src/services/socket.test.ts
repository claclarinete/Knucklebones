import { describe, expect, it } from 'vitest';
import { createSocket } from './socket';

describe('createSocket', () => {
  it('envia o token no handshake e não conecta automaticamente', () => {
    const socket = createSocket('meu-token');

    expect(socket.auth).toEqual({ token: 'meu-token' });
    expect(socket.connected).toBe(false);
  });
});
