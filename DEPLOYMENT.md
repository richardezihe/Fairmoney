# Deployment Guide for FAIR MONEY

This guide covers deploying the FAIR MONEY Telegram bot and admin dashboard to Render.

## Prerequisites

1. A GitHub account where you'll push this code
2. A Render.com account
3. A Telegram bot token (from BotFather)

## Step 1: Push to GitHub

First, push your code to a GitHub repository:

```bash
# Initialize git repository if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit"

# Add your GitHub repo as remote
git remote add origin https://github.com/yourusername/fair-money.git

# Push to GitHub
git push -u origin main
```

## Step 2: Deploy to Render

There are two ways to deploy to Render:

### Option 1: Using the render.yaml Blueprint

1. Log in to your Render dashboard
2. Click on the "Blueprints" tab
3. Click "New Blueprint Instance"
4. Select your GitHub repository
5. Render will automatically detect the `render.yaml` file and create:
   - A web service for the application
   - A PostgreSQL database
6. Confirm the creation

### Option 2: Manual Setup

#### Step 2.1: Create a PostgreSQL Database

1. In your Render dashboard, go to "Databases"
2. Click "New Database"
3. Select PostgreSQL
4. Choose a name (e.g., `fair-money-db`)
5. Select your preferred region
6. Click "Create Database"
7. Wait for the database to be created, then copy the "Internal Connection String"

#### Step 2.2: Create a Web Service

1. In your Render dashboard, go to "Web Services"
2. Click "New Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - Name: `fair-money-bot`
   - Environment: Node
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm start`
5. Add environment variables:
   - `DATABASE_URL`: Paste the database connection string from step 2.1
   - `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
   - `NODE_ENV`: `production`
6. Click "Create Web Service"

## Step 3: Set Up Your Database

After deployment, you'll need to push your database schema:

1. In your Render dashboard, go to your web service
2. Click on the "Shell" tab
3. Run the following command to push your schema:
   ```bash
   npm run db:push
   ```

## Step 4: Verify Deployment

1. Open your web service URL (e.g., `https://fair-money-bot.onrender.com`)
2. You should see the admin login page
3. Log in with the default credentials:
   - Username: `admin`
   - Password: `admin123`
4. Check that your Telegram bot is active by sending it a message

## Step 5: Security Considerations

After successfully deploying:

1. Change the default admin password
2. Consider setting up a custom domain if needed
3. Set up automatic database backups for your PostgreSQL database

## Troubleshooting

If you encounter issues:

1. Check the logs in your Render dashboard
2. Ensure all environment variables are correctly set
3. Verify your Telegram bot token is valid
4. Check the database connection string

For more help, refer to the [Render documentation](https://render.com/docs) or create an issue in your GitHub repository.