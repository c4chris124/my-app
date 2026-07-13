/** Identity extracted from a Google profile by `GoogleStrategy.validate`. */
export interface GoogleIdentity {
  googleId: string;
  email: string | null;
  emailVerified: boolean;
  name: string;
  avatarUrl: string | null;
}
