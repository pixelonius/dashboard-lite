# InfoProduct Management Portal - Local Setup Guide

This guide will help you run the application locally with a fully seeded database.

## Prerequisites

- **Node.js** 20.x or later
- **PostgreSQL** database (local or hosted like Neon, Supabase, etc.)
- **npm** or **yarn** package manager

## Step 1: Clone and Install Dependencies

```bash
# Install dependencies
npm install
```

## Step 2: Set Up Environment Variables

Create a `.env` file in the root directory by copying the example:

```bash
cp .env.example .env
```

Edit the `.env` file with your database credentials:

```env
# Database connection URL
# For local PostgreSQL:
DATABASE_URL="postgresql://postgres:your-password@localhost:5432/infoproduct_portal"

# For Neon/Supabase/other hosted:
# DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# JWT Secret (change this to a secure random string)
JWT_SECRET="your-super-secret-jwt-key-change-me"

# Server configuration
PORT=5000
NODE_ENV=development
```

### Getting a PostgreSQL Database

**Option 1: Local PostgreSQL**
```bash
# On macOS with Homebrew
brew install postgresql
brew services start postgresql
createdb infoproduct_portal

# On Ubuntu/Debian
sudo apt-get install postgresql
sudo service postgresql start
sudo -u postgres createdb infoproduct_portal
```

**Option 2: Cloud Database (Recommended)**
- Sign up for [Neon](https://neon.tech) (Free tier available)
- Create a new database
- Copy the connection string to your `.env` file

## Step 3: Set Up the Database

Generate Prisma Client and push the schema to your database:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (creates all tables)
npx prisma db push
```

## Step 4: Seed the Database

Run the seed script to populate the database with demo data:

```bash
npx prisma db seed
```

This creates:
- ✅ **4 Demo Users** (one for each role):
  - `admin@demo.com` - ADMIN role (full access)
  - `sales@demo.com` - SALES role
  - `marketing@demo.com` - MARKETING role
  - `csm@demo.com` - CSM role
  - **Password for all**: `password123`

- ✅ **Sample Business Data**:
  - 100 leads with UTM tracking
  - 40 orders across different products
  - Payment plans with scheduled installments (some overdue)
  - 12 marketing campaigns (webinars, ads, organic)
  - 90 days of ad spend data
  - 20 content items in various production stages
  - 4 email sequences with engagement tracking
  - 5 contractor/editor records with payments
  - Onboarding milestone events

## Step 5: Run the Application

Start the development server:

```bash
npm run dev
```

The application will be available at: **http://localhost:5000**

## Step 6: Login

Navigate to http://localhost:5000 and use one of the demo accounts:

### Demo Login Credentials

| Email | Password | Role | Access |
|-------|----------|------|--------|
| `admin@demo.com` | `password123` | ADMIN | All dashboards |
| `sales@demo.com` | `password123` | SALES | Sales dashboard only |
| `marketing@demo.com` | `password123` | MARKETING | Marketing + Email dashboards |
| `csm@demo.com` | `password123` | CSM | Customer Success dashboard |

You can also use the **Quick Login** buttons on the login page for instant access.

## Common Issues & Solutions

### Issue: Database connection error
**Solution**: Verify your `DATABASE_URL` in `.env` is correct and the database server is running.

### Issue: "User not found" when logging in
**Solution**: Make sure you ran `npx prisma db seed` to create demo users.

### Issue: Tables don't exist
**Solution**: Run `npx prisma db push` to create all database tables.

### Issue: Prisma Client errors
**Solution**: Run `npx prisma generate` to regenerate the Prisma Client.

### Issue: Port 5000 already in use
**Solution**: Change the `PORT` in your `.env` file to a different port (e.g., 3000, 8000).

## Database Management

### View Database in Prisma Studio
```bash
npx prisma studio
```
Opens a visual database editor at http://localhost:5555

### Reset Database (Clear all data)
```bash
npx prisma migrate reset
```
This will drop all data and re-run the seed script.

### Re-seed Database
```bash
npx prisma db seed
```

## Project Structure

```
├── client/               # React frontend
│   ├── src/
│   │   ├── pages/       # Dashboard pages (Sales, Marketing, CSM, Email)
│   │   ├── components/  # Reusable UI components
│   │   └── lib/         # Auth context, query client
├── server/              # Express backend
│   ├── routes.ts        # API endpoints
│   ├── lib/             # Auth utilities
│   └── middleware/      # Auth middleware
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed data script
└── .env                 # Environment variables (create this)
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production build
- `npx prisma studio` - Open database GUI
- `npx prisma db seed` - Seed database with demo data
- `npx prisma db push` - Push schema changes to database
- `npx prisma generate` - Generate Prisma Client

## What's Next?

Once the application is running:

1. **Explore Dashboards**: Login as different roles to see role-based access control
2. **View Analytics**: Check out the KPIs, charts, and data tables
3. **Test Filtering**: Use date range pickers and table filters
4. **Export Data**: Try the CSV export functionality
5. **Customize**: Modify the schema, seed data, or UI to fit your needs

## Support

For issues or questions:
- Check the error logs in your terminal
- Review the Prisma documentation: https://www.prisma.io/docs
- Check browser console for frontend errors

---

**Ready to deploy?** See the deployment documentation for publishing to Replit or other hosting platforms.
