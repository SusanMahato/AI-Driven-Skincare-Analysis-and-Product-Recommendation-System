import { saveToken, getToken, removeToken, isLoggedIn } from '@/lib/auth';

describe('lib/auth token helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saveToken stores the token under "access_token"', () => {
    saveToken('abc123');
    expect(window.localStorage.getItem('access_token')).toBe('abc123');
  });

  it('getToken returns the stored token', () => {
    window.localStorage.setItem('access_token', 'xyz789');
    expect(getToken()).toBe('xyz789');
  });

  it('getToken returns null when no token is stored', () => {
    expect(getToken()).toBeNull();
  });

  it('removeToken clears the stored token', () => {
    window.localStorage.setItem('access_token', 'abc123');
    removeToken();
    expect(window.localStorage.getItem('access_token')).toBeNull();
  });

  it('isLoggedIn is false with no token', () => {
    expect(isLoggedIn()).toBe(false);
  });

  it('isLoggedIn is true once a token is saved', () => {
    saveToken('abc123');
    expect(isLoggedIn()).toBe(true);
  });

  it('isLoggedIn is false again after removeToken', () => {
    saveToken('abc123');
    removeToken();
    expect(isLoggedIn()).toBe(false);
  });
});
