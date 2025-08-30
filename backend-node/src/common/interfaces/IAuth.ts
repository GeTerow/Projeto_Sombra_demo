import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface ITokenPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface IAuthRequest extends Request {
  user?: ITokenPayload;
}