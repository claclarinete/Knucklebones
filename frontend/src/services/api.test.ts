import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, getHealth } from './api';

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? 'sem json' : JSON.stringify(body), { status }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiFetch', () => {
  it('chama a URL do backend e devolve o JSON', async () => {
    const fetchMock = mockFetch(200, { status: 'ok' });

    await expect(getHealth()).resolves.toEqual({ status: 'ok' });
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/health', expect.any(Object));
  });

  it('envia o corpo como JSON', async () => {
    const fetchMock = mockFetch(200, {});

    await apiFetch('/health', { method: 'POST', body: { a: 1 } });

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(init.body).toBe('{"a":1}');
  });

  it('lança ApiError com a mensagem do backend', async () => {
    mockFetch(503, { error: 'servidor indisponível' });

    const error = await apiFetch('/health').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 503, message: 'servidor indisponível' });
  });

  it('usa uma mensagem genérica quando a resposta de erro não é JSON', async () => {
    mockFetch(500, undefined);

    await expect(apiFetch('/health')).rejects.toThrow('Erro 500');
  });
});
