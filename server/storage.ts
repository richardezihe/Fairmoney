import { User, TelegramUser, WithdrawalRequest, Session, InsertUser, InsertTelegramUser, InsertWithdrawalRequest, InsertSession } from "@shared/schema";
import { db } from "./db";
import { users, telegramUsers, withdrawalRequests, sessions } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // Admin users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Sessions
  createSession(session: InsertSession): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;
  
  // Telegram users
  getTelegramUser(telegramId: string): Promise<TelegramUser | undefined>;
  createTelegramUser(user: InsertTelegramUser): Promise<TelegramUser>;
  updateTelegramUser(telegramId: string, updates: Partial<TelegramUser>): Promise<TelegramUser | undefined>;
  getAllTelegramUsers(): Promise<TelegramUser[]>;
  getTelegramUsersByReferrerId(referrerId: string): Promise<TelegramUser[]>;
  getTelegramUserCount(): Promise<number>;
  
  // Withdrawal requests
  createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest>;
  getWithdrawalRequestsByTelegramId(telegramId: string): Promise<WithdrawalRequest[]>;
  getAllWithdrawalRequests(): Promise<WithdrawalRequest[]>;
  updateWithdrawalRequestStatus(id: number, status: string): Promise<WithdrawalRequest | undefined>;
  getTotalWithdrawalAmount(): Promise<number>;
  
  // System operations
  resetAllData(): Promise<void>;
  resetWithdrawalRequests(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Delay the admin user creation to let the app start
    console.log('DatabaseStorage initialized, will check admin user after startup');
    setTimeout(() => {
      this.ensureAdminUser().catch(err => {
        console.error('Error ensuring admin user exists:', err);
      });
    }, 1000);
  }

  private async ensureAdminUser() {
    console.log('Checking if admin user exists...');
    try {
      const adminUser = await this.getUserByUsername('admin');
      console.log('Admin user check result:', adminUser ? 'exists' : 'not found');
      if (!adminUser) {
        await this.createUser({
          username: 'admin',
          password: 'admin123', // In a real app, this would be hashed
          isAdmin: true
        });
        console.log('Default admin user created');
      }
    } catch (error) {
      console.error('Error in ensureAdminUser:', error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase()));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        username: insertUser.username.toLowerCase()
      })
      .returning();
    return user;
  }

  // Session methods
  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token));
    return session;
  }

  async deleteSession(token: string): Promise<void> {
    await db
      .delete(sessions)
      .where(eq(sessions.token, token));
  }

  // Telegram user methods
  async getTelegramUser(telegramId: string): Promise<TelegramUser | undefined> {
    const [user] = await db
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.telegramId, telegramId));
    return user;
  }

  async createTelegramUser(insertUser: InsertTelegramUser): Promise<TelegramUser> {
    const [user] = await db
      .insert(telegramUsers)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateTelegramUser(telegramId: string, updates: Partial<TelegramUser>): Promise<TelegramUser | undefined> {
    // Remove id from updates if present, as we shouldn't update primary keys
    const { id, ...updateData } = updates;
    
    const [updatedUser] = await db
      .update(telegramUsers)
      .set(updateData)
      .where(eq(telegramUsers.telegramId, telegramId))
      .returning();
    
    return updatedUser;
  }

  async getAllTelegramUsers(): Promise<TelegramUser[]> {
    return db.select().from(telegramUsers);
  }

  async getTelegramUsersByReferrerId(referrerId: string): Promise<TelegramUser[]> {
    return db
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.referrerId, referrerId));
  }

  async getTelegramUserCount(): Promise<number> {
    const users = await db.select().from(telegramUsers);
    return users.length;
  }

  // Withdrawal request methods
  async createWithdrawalRequest(insertRequest: InsertWithdrawalRequest): Promise<WithdrawalRequest> {
    const [request] = await db
      .insert(withdrawalRequests)
      .values(insertRequest)
      .returning();
    
    return request;
  }

  async getWithdrawalRequestsByTelegramId(telegramId: string): Promise<WithdrawalRequest[]> {
    return db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.telegramUserId, telegramId))
      .orderBy(desc(withdrawalRequests.createdAt));
  }

  async getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    return db
      .select()
      .from(withdrawalRequests)
      .orderBy(desc(withdrawalRequests.createdAt));
  }

  async updateWithdrawalRequestStatus(id: number, status: string): Promise<WithdrawalRequest | undefined> {
    const [updatedRequest] = await db
      .update(withdrawalRequests)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(withdrawalRequests.id, id))
      .returning();
    
    return updatedRequest;
  }

  async getTotalWithdrawalAmount(): Promise<number> {
    const approvedRequests = await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.status, 'approved'));
    
    return approvedRequests.reduce((total, request) => total + request.amount, 0);
  }
  
  // System operations
  async resetAllData(): Promise<void> {
    // Keep admin users but reset Telegram users and withdrawal requests
    await db.delete(telegramUsers);
    await db.delete(withdrawalRequests);
    
    console.log('All data has been reset successfully');
  }
  
  // Reset only withdrawal requests, preserve Telegram users
  async resetWithdrawalRequests(): Promise<void> {
    await db.delete(withdrawalRequests);
    
    console.log('Withdrawal requests have been reset successfully');
  }
}

export const storage = new DatabaseStorage();
