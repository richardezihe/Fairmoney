# FAIR MONEY - Telegram Bot & Admin Dashboard

A Telegram bot with an admin dashboard for managing user referrals, bonuses, and withdrawal requests.

## Features

- **Telegram Bot**: Engages users, manages referrals, and processes withdrawal requests
- **Admin Dashboard**: Provides oversight of user activities and withdrawal management
- **Referral System**: Tracks user referrals and awards bonuses
- **Withdrawal Management**: Allows users to request withdrawals and admins to process them
- **Bank Details Collection**: Securely collects bank details for payouts
- **Weekend-Only Withdrawals**: Restricts withdrawals to weekends (Saturday and Sunday)

## Tech Stack

- **Frontend**: React, TailwindCSS, Shadcn/UI, TanStack Query
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (via Neon Database)
- **ORM**: Drizzle ORM
- **Bot Framework**: Telegraf

## Environment Variables

The following environment variables are required:

```
DATABASE_URL=postgresql://username:password@host:port/database
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/fair-money.git
   cd fair-money
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the required environment variables.

4. Push the database schema:
   ```
   npm run db:push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

## Deployment

This project is configured for deployment on Render.

### Deploying to Render

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Use the following settings:
   - Environment: Node
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm start`
   - Add environment variables (DATABASE_URL, TELEGRAM_BOT_TOKEN)

Alternatively, you can use the `render.yaml` blueprint to set up the entire infrastructure with a PostgreSQL database.

## Admin Dashboard

The admin dashboard is accessible at the root URL of your deployed application. The default admin credentials are:

- Username: `admin`
- Password: `admin123`

**Important**: Change the default admin password after deployment.

## Telegram Bot Commands

The bot supports the following commands:

- `/start` - Start the bot and see welcome message
- `/balance` - Check your current balance
- `/withdraw` - Request a withdrawal (available only on weekends)
- `/referral` - Get your referral link
- `/bonus` - Claim daily bonus
- `/bank` - Set or update your bank details
- `/support` - Get support information

## Database Schema

The application uses the following database tables:

- `users` - Admin users for the dashboard
- `telegram_users` - Users registered via the Telegram bot
- `withdrawal_requests` - Withdrawal requests made by users
- `sessions` - Admin user sessions

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact us through the Telegram support channel or create an issue in the GitHub repository.