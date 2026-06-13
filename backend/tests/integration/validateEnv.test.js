const validateEnv = require('../../src/config/validateEnv');

describe('Environment Variable Validation Tests', () => {
  let originalEnv;
  let exitMock;
  let errorMock;
  let warnMock;

  beforeEach(() => {
    originalEnv = { ...process.env };
    exitMock = jest.spyOn(process, 'exit').mockImplementation(() => {});
    errorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    warnMock = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    exitMock.mockRestore();
    errorMock.mockRestore();
    warnMock.mockRestore();
  });

  it('skips validation when NODE_ENV=test', () => {
    delete process.env.JWT_SECRET;
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = 'test';

    validateEnv();

    expect(exitMock).not.toHaveBeenCalled();
    expect(errorMock).not.toHaveBeenCalled();
  });

  it('passes when all required and optional are set (dev)', () => {
    process.env.JWT_SECRET = 'a-strong-secret-of-sufficient-length';
    process.env.DATABASE_URL = 'postgresql://localhost:5432';
    process.env.NODE_ENV = 'development';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.GOOGLE_CLIENT_ID = 'client-id';
    process.env.EMAIL_API_KEY = 'api-key';
    process.env.CSRF_SECRET = 'a-csrf-secret-of-sufficient-length';
    process.env.JWT_ACCESS_SECRET = 'a-jwt-access-secret-of-sufficient-length';
    process.env.JWT_REFRESH_SECRET =
      'a-jwt-refresh-secret-of-sufficient-length';

    validateEnv();

    expect(exitMock).not.toHaveBeenCalled();
    expect(errorMock).not.toHaveBeenCalled();
  });

  it('terminates if JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    process.env.DATABASE_URL = 'postgresql://localhost:5432';
    process.env.NODE_ENV = 'development';

    validateEnv();

    expect(exitMock).toHaveBeenCalledWith(1);
    expect(errorMock).toHaveBeenCalledWith(
      expect.stringContaining('JWT_SECRET')
    );
  });

  it('terminates if JWT_SECRET is too short', () => {
    process.env.JWT_SECRET = 'short';
    process.env.DATABASE_URL = 'postgresql://localhost:5432';
    process.env.NODE_ENV = 'development';

    validateEnv();

    expect(exitMock).toHaveBeenCalledWith(1);
    expect(errorMock).toHaveBeenCalledWith(
      expect.stringContaining('JWT_SECRET')
    );
  });

  it('terminates if DATABASE_URL is missing', () => {
    process.env.JWT_SECRET = 'a-strong-secret-of-sufficient-length';
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = 'development';

    validateEnv();

    expect(exitMock).toHaveBeenCalledWith(1);
    expect(errorMock).toHaveBeenCalledWith(
      expect.stringContaining('DATABASE_URL')
    );
  });

  it('terminates if a required variable is whitespace only', () => {
    process.env.JWT_SECRET = '   ';
    process.env.DATABASE_URL = 'postgresql://localhost:5432';
    process.env.NODE_ENV = 'development';

    validateEnv();

    expect(exitMock).toHaveBeenCalledWith(1);
    expect(errorMock).toHaveBeenCalledWith(
      expect.stringContaining('JWT_SECRET')
    );
  });

  it('requires CSRF_SECRET in production', () => {
    process.env.JWT_SECRET = 'a-strong-secret-of-sufficient-length';
    process.env.DATABASE_URL = 'postgresql://localhost:5432';
    process.env.NODE_ENV = 'production';
    delete process.env.CSRF_SECRET;

    validateEnv();

    expect(exitMock).toHaveBeenCalledWith(1);
    expect(errorMock).toHaveBeenCalledWith(
      expect.stringContaining('CSRF_SECRET')
    );
  });

  it('prints warnings but does not terminate when optionals missing', () => {
    process.env.JWT_SECRET = 'a-strong-secret-of-sufficient-length';
    process.env.DATABASE_URL = 'postgresql://localhost:5432';
    process.env.NODE_ENV = 'development';
    delete process.env.REDIS_URL;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.EMAIL_API_KEY;

    validateEnv();

    expect(exitMock).not.toHaveBeenCalled();
    expect(warnMock).toHaveBeenCalled();
  });
});
