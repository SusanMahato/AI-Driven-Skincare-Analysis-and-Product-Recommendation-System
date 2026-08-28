/**
 * lib/api.ts registers its interceptors once, at module import time, on
 * the axios instance it creates. Rather than mocking a full HTTP round
 * trip, these tests capture the interceptor callback functions as they're
 * registered and invoke them directly with synthetic request/response/error
 * objects — this isolates the interceptor logic from axios/network internals.
 */

const requestHandlers: any[] = [];
const responseHandlers: { onFulfilled: any; onRejected: any }[] = [];

jest.mock('axios', () => {
  const mockInstance = {
    interceptors: {
      request: {
        use: (onFulfilled: any) => requestHandlers.push(onFulfilled),
      },
      response: {
        use: (onFulfilled: any, onRejected: any) =>
          responseHandlers.push({ onFulfilled, onRejected }),
      },
    },
    post: jest.fn(),
    get: jest.fn(),
  };

  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockInstance),
      post: jest.fn(),
    },
  };
});

describe('lib/api interceptors', () => {
  beforeEach(() => {
    jest.resetModules();
    requestHandlers.length = 0;
    responseHandlers.length = 0;
    window.localStorage.clear();
    window.history.pushState({}, '', '/dashboard');
  });

  it('attaches the Authorization header when a token is stored', async () => {
    window.localStorage.setItem('access_token', 'my-jwt-token');

    await import('@/lib/api');

    const config = {
      headers: {} as Record<string, string>,
    };

    const result = requestHandlers[0](config);

    expect(result.headers.Authorization).toBe('Bearer my-jwt-token');
  });

  it('does not attach an Authorization header when no token is stored', async () => {
    await import('@/lib/api');

    const config = {
      headers: {} as Record<string, string>,
    };

    const result = requestHandlers[0](config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it('clears the stored token on a 401 response', async () => {
    window.localStorage.setItem('access_token', 'expired-token');

    await import('@/lib/api');

    const error = {
      response: {
        status: 401,
      },
    };

    await expect(
      responseHandlers[0].onRejected(error)
    ).rejects.toBe(error);

    expect(window.localStorage.getItem('access_token')).toBeNull();
  });

  it('still clears the token when already on the login page', async () => {
    window.history.pushState({}, '', '/login');
    window.localStorage.setItem('access_token', 'expired-token');

    await import('@/lib/api');

    const error = {
      response: {
        status: 401,
      },
    };

    await expect(
      responseHandlers[0].onRejected(error)
    ).rejects.toBe(error);

    expect(window.localStorage.getItem('access_token')).toBeNull();
  });

  it('leaves the token untouched for non-401 errors', async () => {
    window.localStorage.setItem('access_token', 'still-valid-token');

    await import('@/lib/api');

    const error = {
      response: {
        status: 500,
      },
    };

    await expect(
      responseHandlers[0].onRejected(error)
    ).rejects.toBe(error);

    expect(window.localStorage.getItem('access_token')).toBe(
      'still-valid-token'
    );
  });
});
