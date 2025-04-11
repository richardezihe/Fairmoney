import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { storage } from './storage';

// Environment variable for JWT secret, fallback to a default if not provided
const JWT_SECRET = process.env.JWT_SECRET || 'fairmoney_admin_secret_key';

// Interface for JWT payload
interface JwtPayload {
  userId: number;
  username: string;
  sessionId: number;
}

// Add user to Request type
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Create a JWT token
export function createToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Middleware to authenticate requests
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is required' });
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Check if the session exists
    const session = await storage.getSessionByToken(token);
    
    if (!session) {
      return res.status(401).json({ message: 'Session has expired or been revoked' });
    }
    
    // Check if session is expired
    if (new Date() > new Date(session.expiresAt)) {
      await storage.deleteSession(token);
      return res.status(401).json({ message: 'Session has expired' });
    }
    
    // Set the user on the request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}
