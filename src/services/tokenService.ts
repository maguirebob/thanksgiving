import crypto from 'crypto';

export interface TokenData {
  token: string;
  expiresAt: Date;
}

export class TokenService {
  /**
   * Generate a secure random token for password reset
   */
  static generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create token data with expiration (1 hour from now)
   */
  static createTokenData(): TokenData {
    const token = this.generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration
    
    return {
      token,
      expiresAt
    };
  }

  /**
   * Check if a token is expired
   */
  static isTokenExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  /**
   * Validate token format (basic check)
   */
  static isValidTokenFormat(token: string): boolean {
    // Token should be 64 characters (32 bytes as hex)
    return /^[a-f0-9]{64}$/.test(token);
  }

  /**
   * Generate a secure random string for other purposes
   */
  static generateSecureString(length: number = 16): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

export class RateLimitService {
  private static attempts: Map<string, { count: number; lastAttempt: Date }> = new Map();

  /**
   * Check if email is rate limited (max 3 attempts per hour)
   */
  static isRateLimited(email: string): boolean {
    const now = new Date();
    const key = email.toLowerCase();
    const attempt = this.attempts.get(key);

    if (!attempt) {
      return false;
    }

    // Reset if more than 1 hour has passed
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    if (attempt.lastAttempt < oneHourAgo) {
      this.attempts.delete(key);
      return false;
    }

    // Check if max attempts reached
    return attempt.count >= 3;
  }

  /**
   * Record an attempt for rate limiting
   */
  static recordAttempt(email: string): void {
    const now = new Date();
    const key = email.toLowerCase();
    const attempt = this.attempts.get(key);

    if (!attempt) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
    } else {
      // Reset if more than 1 hour has passed
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      if (attempt.lastAttempt < oneHourAgo) {
        this.attempts.set(key, { count: 1, lastAttempt: now });
      } else {
        attempt.count++;
        attempt.lastAttempt = now;
      }
    }
  }

  /**
   * Get remaining attempts for an email
   */
  static getRemainingAttempts(email: string): number {
    const key = email.toLowerCase();
    const attempt = this.attempts.get(key);

    if (!attempt) {
      return 3;
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    if (attempt.lastAttempt < oneHourAgo) {
      return 3;
    }

    return Math.max(0, 3 - attempt.count);
  }

  /**
   * Clear rate limit for an email (for testing)
   */
  static clearRateLimit(email: string): void {
    this.attempts.delete(email.toLowerCase());
  }
}
