# InfoProduct Management Portal - Setup Guide

This guide will help you run the application locally or deploy it to Vercel.

## Prerequisites

- **Node.js** 20.x or later
- **PostgreSQL** database (local or hosted like Neon, Supabase, etc.)
- **npm** or **yarn** package manager

## Local Development

### Step 1: Clone and Install Dependencies

```bash
# Install dependencies
npm install
```

### Step 2: Set Up Environment Variables

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

### Step 3: Set Up the Database

Generate Prisma Client and push the schema to your database:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (creates all tables)
npx prisma db push
```

### Step 4: Seed the Database

Run the seed script to populate the database with demo data:

```bash
npx prisma db seed
```

This creates:
- ✅ **3 Demo Users** (one for each role):
  - `admin@demo.com` - ADMIN role (full access)
  - `sales@demo.com` - SALES role
  - `marketing@demo.com` - MARKETING role
  - **Password for all**: `password123`

- ✅ **Sample Business Data**:
  - Leads, Sales Calls, Enrollments, Payments, and Marketing Data.

### Step 5: Run the Application

Start the development server:

```bash
npm run dev
```

The application will be available at: **http://localhost:5000**

### Step 6: Login

Navigate to http://localhost:5000 and use one of the demo accounts:

| Email | Password | Role | Access |
|-------|----------|------|--------|
| `admin@demo.com` | `password123` | ADMIN | All dashboards |
| `sales@demo.com` | `password123` | SALES | Sales dashboard only |
| `marketing@demo.com` | `password123` | MARKETING | Marketing + Email dashboards |

---

## Vercel Deployment

This project is configured for easy deployment on Vercel.

1.  **Push to GitHub**: Ensure your code is in a GitHub repository.
2.  **Import to Vercel**:
    - Go to your Vercel Dashboard.
    - Click "Add New..." -> "Project".
    - Import your GitHub repository.
3.  **Configure Environment Variables**:
    - In the Vercel project settings, add the following Environment Variables:
        - `DATABASE_URL`: Your production PostgreSQL connection string.
        - `JWT_SECRET`: A secure random string for authentication.
        - `NODE_ENV`: Set to `production`.
4.  **Deploy**: Click "Deploy".

Vercel will automatically detect the configuration in `vercel.json` and deploy your app as a serverless function.

---

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
