import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken, createToken } from "./auth";
import { z } from "zod";
import crypto from 'crypto';
import { initializeTelegramBot } from "./bot";

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("Starting route registration...");
  
  // Create HTTP server
  const httpServer = createServer(app);
  console.log("HTTP server created");

  // Initialize Telegram bot - using setTimeout to avoid blocking server startup
  console.log("Setting up Telegram bot initialization...");
  setTimeout(async () => {
    try {
      console.log("Initializing Telegram bot in background...");
      await initializeTelegramBot();
      console.log("Telegram bot initialization completed");
    } catch (error) {
      console.error("Error initializing Telegram bot:", error);
      console.log("Continuing server operation despite Telegram bot initialization failure");
    }
  }, 1000);
  console.log("Telegram bot initialization scheduled, continuing with server startup");

  console.log("Setting up authentication routes...");
  // Authentication routes
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Create session token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days
      
      const session = await storage.createSession({
        userId: user.id,
        token,
        expiresAt
      });
      
      // Generate JWT token
      const jwtToken = createToken({ 
        userId: user.id, 
        username: user.username, 
        sessionId: session.id 
      });
      
      res.json({ 
        token: jwtToken,
        user: {
          id: user.id,
          username: user.username,
          isAdmin: user.isAdmin
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  });
  
  app.get('/api/auth/me', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      console.error('Auth check error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.post('/api/auth/logout', authenticateToken, async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (token && req.user?.sessionId) {
        await storage.deleteSession(token);
      }
      
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Server error during logout' });
    }
  });

  // Admin API routes
  // All admin routes require authentication
  
  // Get dashboard stats
  app.get('/api/admin/stats', authenticateToken, async (req: Request, res: Response) => {
    try {
      const allUsers = await storage.getAllTelegramUsers();
      const allWithdrawals = await storage.getAllWithdrawalRequests();
      
      const pendingWithdrawals = allWithdrawals.filter(w => w.status === 'pending').length;
      const approvedWithdrawals = allWithdrawals.filter(w => w.status === 'approved');
      const totalPayouts = approvedWithdrawals.reduce((sum, w) => sum + w.amount, 0);
      
      // Get recent users (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentUsers = allUsers.filter(u => {
        return u.createdAt && new Date(u.createdAt) > thirtyDaysAgo;
      }).length;
      
      res.json({
        totalUsers: 100000, // Display 100,000 for marketing purposes
        actualUsers: allUsers.length,
        totalPayouts: 5000000, // Display 5,000,000 for marketing purposes
        actualPayouts: totalPayouts,
        pendingWithdrawals,
        recentUsers
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
  });
  
  // Get all users
  app.get('/api/admin/users', authenticateToken, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllTelegramUsers();
      
      // Sort by ID in descending order (newest first)
      users.sort((a, b) => b.id - a.id);
      
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Error fetching users' });
    }
  });
  
  // Get all withdrawal requests
  app.get('/api/admin/withdrawals', authenticateToken, async (req: Request, res: Response) => {
    try {
      const withdrawals = await storage.getAllWithdrawalRequests();
      const users = await storage.getAllTelegramUsers();
      
      // Create a map of telegram users for easy lookup
      const userMap = new Map();
      users.forEach(user => {
        userMap.set(user.telegramId, user);
      });
      
      // Enrich withdrawal requests with user data
      const enrichedWithdrawals = withdrawals.map(withdrawal => {
        const user = userMap.get(withdrawal.telegramUserId);
        return {
          ...withdrawal,
          user: user ? {
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username
          } : null
        };
      });
      
      // Sort by ID in descending order (newest first)
      enrichedWithdrawals.sort((a, b) => b.id - a.id);
      
      res.json(enrichedWithdrawals);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      res.status(500).json({ message: 'Error fetching withdrawal requests' });
    }
  });
  
  // Update withdrawal request status
  app.post('/api/admin/withdrawals/update', authenticateToken, async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        id: z.number(),
        status: z.string().refine(s => ['pending', 'approved', 'rejected'].includes(s))
      });
      
      const validationResult = schema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid request data',
          errors: validationResult.error.errors 
        });
      }
      
      const { id, status } = validationResult.data;
      
      // Get the withdrawal request
      const withdrawalRequests = await storage.getAllWithdrawalRequests();
      const withdrawalRequest = withdrawalRequests.find(w => w.id === id);
      
      if (!withdrawalRequest) {
        return res.status(404).json({ message: 'Withdrawal request not found' });
      }
      
      // If approving and it wasn't already approved, update user balance
      if (status === 'approved' && withdrawalRequest.status !== 'approved') {
        const user = await storage.getTelegramUser(withdrawalRequest.telegramUserId);
        
        if (user) {
          // Deduct the withdrawal amount from the user's balance
          await storage.updateTelegramUser(user.telegramId, {
            balance: user.balance - withdrawalRequest.amount
          });
        }
      }
      
      // If reverting from approved to another status, add the amount back to user balance
      if (withdrawalRequest.status === 'approved' && status !== 'approved') {
        const user = await storage.getTelegramUser(withdrawalRequest.telegramUserId);
        
        if (user) {
          // Add the withdrawal amount back to the user's balance
          await storage.updateTelegramUser(user.telegramId, {
            balance: user.balance + withdrawalRequest.amount
          });
        }
      }
      
      // Update the status
      const updatedRequest = await storage.updateWithdrawalRequestStatus(id, status);
      
      if (!updatedRequest) {
        return res.status(404).json({ message: 'Failed to update withdrawal request' });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      res.status(500).json({ message: 'Error updating withdrawal status' });
    }
  });
  
  // Reset withdrawal requests
  app.post('/api/admin/reset-withdrawals', authenticateToken, async (req: Request, res: Response) => {
    try {
      await storage.resetWithdrawalRequests();
      res.json({ message: 'Withdrawal requests have been reset successfully' });
    } catch (error) {
      console.error('Error resetting withdrawal requests:', error);
      res.status(500).json({ message: 'Error resetting withdrawal requests' });
    }
  });
  
  // Reset all data
  app.post('/api/admin/reset-all-data', authenticateToken, async (req: Request, res: Response) => {
    try {
      await storage.resetAllData();
      res.json({ message: 'All data has been reset successfully' });
    } catch (error) {
      console.error('Error resetting all data:', error);
      res.status(500).json({ message: 'Error resetting all data' });
    }
  });

  return httpServer;
}
