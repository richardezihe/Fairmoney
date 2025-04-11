import { Telegraf, Markup, Context } from 'telegraf';
import { storage } from './storage';
import { TelegramUser } from '@shared/schema';

// Environment variable for Telegram bot token, fallback to a default if not provided
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// Check if the bot token is provided
if (!BOT_TOKEN) {
  console.warn('TELEGRAM_BOT_TOKEN is not set. Bot will not be initialized.');
}

const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

// Configuration options
const REFERRAL_BONUS = 100; // Amount given to both referrer and referee
const DAILY_BONUS = 50; // Daily bonus amount
const MIN_WITHDRAWAL = 500; // Minimum withdrawal amount
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || ''; // Channel users must join to get bonus
const GROUP_ID = process.env.TELEGRAM_GROUP_ID || ''; // Group users must join to get bonus

// Initialize the bot
export async function initializeTelegramBot() {
  if (!bot) {
    console.log('Telegram bot not initialized due to missing token');
    return;
  }

  // Set bot commands
  await bot.telegram.setMyCommands([
    { command: 'start', description: 'Start the bot' },
    { command: 'balance', description: 'Check your balance' },
    { command: 'withdraw', description: 'Withdraw your earnings' },
    { command: 'referral', description: 'Get your referral link' },
    { command: 'bonus', description: 'Claim daily bonus' },
    { command: 'help', description: 'Get help' }
  ]);

  // Handle /start command
  bot.command('start', async (ctx) => {
    try {
      const telegramId = ctx.from.id.toString();
      const firstName = ctx.from.first_name;
      const lastName = ctx.from?.last_name || '';
      const username = ctx.from?.username || '';
      
      // Check if user already exists
      let user = await storage.getTelegramUser(telegramId);
      
      if (!user) {
        // Extract referral code if present
        const startPayload = ctx.message.text.split(' ')[1];
        let referrerId = null;
        
        if (startPayload) {
          referrerId = startPayload;
          const referrer = await storage.getTelegramUser(referrerId);
          
          if (referrer) {
            // Update referrer's stats and balance
            await storage.updateTelegramUser(referrerId, {
              referralCount: referrer.referralCount + 1,
              balance: referrer.balance + REFERRAL_BONUS
            });
            
            // Send notification to referrer
            bot.telegram.sendMessage(
              parseInt(referrerId),
              `🎉 Congratulations! ${firstName} joined using your referral link. You received ₦${REFERRAL_BONUS} bonus!`
            ).catch(err => console.error('Error sending referral notification:', err));
          }
        }
        
        // Create new user
        user = await storage.createTelegramUser({
          telegramId,
          firstName,
          lastName: lastName || null,
          username: username || null,
          balance: referrerId ? REFERRAL_BONUS : 0, // Give bonus if user joined via referral
          referrerId,
          referralCount: 0,
          hasJoinedGroups: false,
          lastBonusClaim: null,
          bankAccountNumber: null,
          bankName: null,
          bankAccountName: null
        });
        
        // Welcome message for new users
        await ctx.reply(
          `👋 Welcome to FairMoney Bot, ${firstName}!\n\n` +
          `This bot allows you to earn money through referrals and daily bonuses.\n\n` +
          `${referrerId ? `🎁 You received ₦${REFERRAL_BONUS} as a welcome bonus for using a referral link!` : ''}`,
          Markup.keyboard([
            ['💰 Balance', '🔗 Referral Link'],
            ['💸 Withdraw', '🎁 Daily Bonus'],
            ['ℹ️ Help']
          ]).resize()
        );
      } else {
        // Welcome back message for existing users
        await ctx.reply(
          `Welcome back, ${firstName}!\n\n` +
          `Your current balance: ₦${user.balance}\n` +
          `Total referrals: ${user.referralCount}`,
          Markup.keyboard([
            ['💰 Balance', '🔗 Referral Link'],
            ['💸 Withdraw', '🎁 Daily Bonus'],
            ['ℹ️ Help']
          ]).resize()
        );
      }
    } catch (error) {
      console.error('Error in start command:', error);
      await ctx.reply('Sorry, there was an error. Please try again later.');
    }
  });

  // Handle /balance command
  bot.command('balance', async (ctx) => {
    await handleBalanceCheck(ctx);
  });

  // Handle "💰 Balance" button
  bot.hears('💰 Balance', async (ctx) => {
    await handleBalanceCheck(ctx);
  });

  // Handle /referral command
  bot.command('referral', async (ctx) => {
    await handleReferral(ctx);
  });

  // Handle "🔗 Referral Link" button
  bot.hears('🔗 Referral Link', async (ctx) => {
    await handleReferral(ctx);
  });

  // Handle /withdraw command
  bot.command('withdraw', async (ctx) => {
    await handleWithdrawal(ctx);
  });

  // Handle "💸 Withdraw" button
  bot.hears('💸 Withdraw', async (ctx) => {
    await handleWithdrawal(ctx);
  });

  // Handle /bonus command
  bot.command('bonus', async (ctx) => {
    await handleBonus(ctx);
  });

  // Handle "🎁 Daily Bonus" button
  bot.hears('🎁 Daily Bonus', async (ctx) => {
    await handleBonus(ctx);
  });

  // Handle /help command
  bot.command('help', async (ctx) => {
    await handleHelp(ctx);
  });

  // Handle "ℹ️ Help" button
  bot.hears('ℹ️ Help', async (ctx) => {
    await handleHelp(ctx);
  });

  // Start the bot
  bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}`, err);
  });

  await bot.launch();
  console.log('Telegram bot successfully launched');
  
  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

// Helper functions
async function handleBalanceCheck(ctx: Context) {
  try {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;
    
    const user = await storage.getTelegramUser(telegramId);
    if (!user) {
      return ctx.reply('Please use /start to register first.');
    }
    
    await ctx.reply(
      `💰 *Your Balance*\n\n` +
      `Current balance: ₦${user.balance}\n` +
      `Total referrals: ${user.referralCount}\n\n` +
      `You can withdraw your earnings once you reach ₦${MIN_WITHDRAWAL}.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error checking balance:', error);
    await ctx.reply('Sorry, there was an error checking your balance. Please try again.');
  }
}

async function handleReferral(ctx: Context) {
  try {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;
    
    const user = await storage.getTelegramUser(telegramId);
    if (!user) {
      return ctx.reply('Please use /start to register first.');
    }
    
    const botInfo = await ctx.telegram.getMe();
    const referralLink = `https://t.me/${botInfo.username}?start=${telegramId}`;
    
    await ctx.reply(
      `🔗 *Your Referral Link*\n\n` +
      `Share this link with your friends and earn ₦${REFERRAL_BONUS} for each person who joins!\n\n` +
      `${referralLink}\n\n` +
      `Total referrals: ${user.referralCount}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error generating referral link:', error);
    await ctx.reply('Sorry, there was an error generating your referral link. Please try again.');
  }
}

async function handleWithdrawal(ctx: Context) {
  try {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;
    
    const user = await storage.getTelegramUser(telegramId);
    if (!user) {
      return ctx.reply('Please use /start to register first.');
    }
    
    if (user.balance < MIN_WITHDRAWAL) {
      return ctx.reply(
        `You need at least ₦${MIN_WITHDRAWAL} to withdraw. Your current balance is ₦${user.balance}.`
      );
    }
    
    // Check if user has bank details
    if (!user.bankName || !user.bankAccountNumber || !user.bankAccountName) {
      ctx.reply(
        'Please provide your bank details to withdraw.\n\n' +
        'Format: /setbank [bank name] | [account number] | [account name]\n\n' +
        'Example: /setbank Access Bank | 1234567890 | John Doe'
      );
      return;
    }
    
    // Ask for withdrawal amount
    ctx.reply(
      `💸 Enter the amount you want to withdraw (minimum ₦${MIN_WITHDRAWAL}):\n` +
      'Format: /withdraw_amount [amount]\n\n' +
      'Example: /withdraw_amount 1000'
    );
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    await ctx.reply('Sorry, there was an error processing your withdrawal request. Please try again.');
  }
}

// Handle bank details setting
bot?.command('setbank', async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    const user = await storage.getTelegramUser(telegramId);
    
    if (!user) {
      return ctx.reply('Please use /start to register first.');
    }
    
    const input = ctx.message.text.substring('/setbank'.length).trim();
    const parts = input.split('|').map(part => part.trim());
    
    if (parts.length !== 3) {
      return ctx.reply(
        'Invalid format. Please use:\n/setbank [bank name] | [account number] | [account name]\n\n' +
        'Example: /setbank Access Bank | 1234567890 | John Doe'
      );
    }
    
    const [bankName, bankAccountNumber, bankAccountName] = parts;
    
    if (!bankName || !bankAccountNumber || !bankAccountName) {
      return ctx.reply('All fields are required. Please try again.');
    }
    
    // Update user bank details
    await storage.updateTelegramUser(telegramId, {
      bankName,
      bankAccountNumber,
      bankAccountName
    });
    
    await ctx.reply(
      '✅ Bank details updated successfully!\n\n' +
      `Bank: ${bankName}\n` +
      `Account Number: ${bankAccountNumber}\n` +
      `Account Name: ${bankAccountName}\n\n` +
      'You can now proceed with withdrawals.'
    );
  } catch (error) {
    console.error('Error setting bank details:', error);
    await ctx.reply('Sorry, there was an error saving your bank details. Please try again.');
  }
});

// Handle withdrawal amount
bot?.command('withdraw_amount', async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    const user = await storage.getTelegramUser(telegramId);
    
    if (!user) {
      return ctx.reply('Please use /start to register first.');
    }
    
    // Check if user has bank details
    if (!user.bankName || !user.bankAccountNumber || !user.bankAccountName) {
      return ctx.reply(
        'Please set your bank details first with /setbank command.'
      );
    }
    
    const input = ctx.message.text.substring('/withdraw_amount'.length).trim();
    const amount = parseInt(input);
    
    if (isNaN(amount) || amount <= 0) {
      return ctx.reply('Please enter a valid amount.');
    }
    
    if (amount < MIN_WITHDRAWAL) {
      return ctx.reply(`Minimum withdrawal amount is ₦${MIN_WITHDRAWAL}.`);
    }
    
    if (amount > user.balance) {
      return ctx.reply(`You don't have enough balance. Your current balance is ₦${user.balance}.`);
    }
    
    // Create withdrawal request
    const withdrawalRequest = await storage.createWithdrawalRequest({
      telegramUserId: telegramId,
      amount,
      bankName: user.bankName,
      bankAccountNumber: user.bankAccountNumber,
      bankAccountName: user.bankAccountName,
      status: 'pending'
    });
    
    // Deduct amount from user balance
    await storage.updateTelegramUser(telegramId, {
      balance: user.balance - amount
    });
    
    await ctx.reply(
      '✅ Withdrawal request submitted successfully!\n\n' +
      `Amount: ₦${amount}\n` +
      `Bank: ${user.bankName}\n` +
      `Account Number: ${user.bankAccountNumber}\n` +
      `Account Name: ${user.bankAccountName}\n\n` +
      'Your request is being processed and you will receive your payment within 24-48 hours.'
    );
  } catch (error) {
    console.error('Error processing withdrawal amount:', error);
    await ctx.reply('Sorry, there was an error processing your withdrawal. Please try again later.');
  }
});

async function handleBonus(ctx: Context) {
  try {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;
    
    const user = await storage.getTelegramUser(telegramId);
    if (!user) {
      return ctx.reply('Please use /start to register first.');
    }
    
    // Check if user has joined required groups
    if (!user.hasJoinedGroups && (CHANNEL_ID || GROUP_ID)) {
      let message = 'To claim your daily bonus, you must join our:';
      
      if (CHANNEL_ID) {
        message += '\n- Channel: [Join Channel](https://t.me/' + CHANNEL_ID + ')';
      }
      
      if (GROUP_ID) {
        message += '\n- Group: [Join Group](https://t.me/' + GROUP_ID + ')';
      }
      
      message += '\n\nAfter joining, click the "Verify Membership" button below.';
      
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.callback('✅ Verify Membership', 'verify_joined')
        ])
      });
      
      return;
    }
    
    // Check if user has already claimed bonus today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (user.lastBonusClaim && new Date(user.lastBonusClaim) >= today) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const hoursRemaining = Math.ceil((tomorrow.getTime() - Date.now()) / (1000 * 60 * 60));
      
      return ctx.reply(
        `You've already claimed your daily bonus today. Come back in ${hoursRemaining} hours.`
      );
    }
    
    // Give daily bonus
    const updatedUser = await storage.updateTelegramUser(telegramId, {
      balance: user.balance + DAILY_BONUS,
      lastBonusClaim: new Date()
    });
    
    await ctx.reply(
      `🎁 You've successfully claimed your daily bonus of ₦${DAILY_BONUS}!\n\n` +
      `New balance: ₦${updatedUser?.balance || 0}`
    );
  } catch (error) {
    console.error('Error processing daily bonus:', error);
    await ctx.reply('Sorry, there was an error processing your daily bonus. Please try again later.');
  }
}

// Handle group membership verification
bot?.action('verify_joined', async (ctx) => {
  try {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;
    
    const user = await storage.getTelegramUser(telegramId);
    if (!user) {
      return ctx.answerCbQuery('Please use /start to register first.');
    }
    
    let hasJoined = true;
    
    // Check channel membership if channel ID is provided
    if (CHANNEL_ID) {
      try {
        const member = await ctx.telegram.getChatMember(`@${CHANNEL_ID}`, parseInt(telegramId));
        if (['left', 'kicked', 'banned'].includes(member.status)) {
          hasJoined = false;
        }
      } catch (error) {
        console.error('Error checking channel membership:', error);
        hasJoined = false;
      }
    }
    
    // Check group membership if group ID is provided
    if (GROUP_ID && hasJoined) {
      try {
        const member = await ctx.telegram.getChatMember(`@${GROUP_ID}`, parseInt(telegramId));
        if (['left', 'kicked', 'banned'].includes(member.status)) {
          hasJoined = false;
        }
      } catch (error) {
        console.error('Error checking group membership:', error);
        hasJoined = false;
      }
    }
    
    if (!hasJoined) {
      return ctx.answerCbQuery('You have not joined all required channels and groups yet.');
    }
    
    // Update user and give daily bonus
    const updatedUser = await storage.updateTelegramUser(telegramId, {
      hasJoinedGroups: true,
      balance: user.balance + DAILY_BONUS,
      lastBonusClaim: new Date()
    });
    
    await ctx.answerCbQuery('Membership verified successfully!');
    
    await ctx.editMessageText(
      `✅ You've successfully joined our community and claimed your daily bonus of ₦${DAILY_BONUS}!\n\n` +
      `New balance: ₦${updatedUser?.balance || 0}`,
      Markup.inlineKeyboard([])
    );
  } catch (error) {
    console.error('Error verifying membership:', error);
    await ctx.answerCbQuery('An error occurred. Please try again later.');
  }
});

async function handleHelp(ctx: Context) {
  try {
    await ctx.reply(
      'ℹ️ *FairMoney Bot Help*\n\n' +
      'Here\'s how to use this bot:\n\n' +
      '• /start - Start the bot and register\n' +
      '• /balance - Check your current balance\n' +
      '• /referral - Get your referral link\n' +
      '• /withdraw - Withdraw your earnings\n' +
      '• /bonus - Claim your daily bonus\n' +
      '• /setbank - Set your bank details for withdrawals\n\n' +
      `You earn ₦${REFERRAL_BONUS} for each person who joins using your referral link, and you can claim ₦${DAILY_BONUS} daily bonus.\n\n` +
      `Minimum withdrawal amount is ₦${MIN_WITHDRAWAL}.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error displaying help:', error);
    await ctx.reply('Sorry, there was an error. Please try again later.');
  }
}
