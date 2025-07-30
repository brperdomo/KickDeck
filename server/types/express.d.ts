import { Request } from 'express';

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      isAdmin: boolean;
      firstName?: string;
      lastName?: string;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};