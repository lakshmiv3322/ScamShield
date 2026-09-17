// server/types.d.ts
// Augments express and express-session types for this project.

import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
        elderModeEnabled: boolean;
        avatarUrl?: string;
        phone?: string;
      };
      familyId?: string;
      memberId?: string;
    }
  }
}

export {};
