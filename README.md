# Info Product Portal - Application Overview

## What is this App?
The **Info Product Portal** is a comprehensive management system designed for businesses that sell online courses, coaching programs, or other information products. It acts as the "central nervous system" for the business, bringing together sales and marketing into one unified dashboard.

Instead of using scattered spreadsheets or disconnected tools, this portal allows the team to:
*   **Track Sales**: See leads, manage sales calls, and monitor revenue.
*   **Manage Students**: Oversee student enrollments and track their payment status.
*   **Monitor Performance**: Keep an eye on how well ads, emails, and individual team members are performing.

---

## How is it Structured?
The application is built using modern web technologies, split into two main parts that talk to each other:

1.  **The Frontend (What you see)**:
    *   Built with **React**, this is the visual interface where you click buttons, view charts, and enter data.
    *   It runs in your web browser and provides a smooth, app-like experience.
    *   It is organized into different "pages" for different roles (e.g., a "Sales" dashboard for closers, a "Marketing" dashboard for media buyers).

2.  **The Backend (The Brain)**:
    *   Built with **Node.js (Express)**, this runs on the server.
    *   It handles all the logic, calculations, and security.
    *   It connects to the **PostgreSQL Database** to save and retrieve information.
    *   It is designed to run on **Vercel** as a serverless function.

---

## The Database: How the Logic Works
For a detailed explanation of the database schema, please refer to [DATABASE.md](./DATABASE.md).

### Quick Overview
*   **Users**: People who log in (Admins, Sales Reps, Marketers).
*   **Team Members**: Staff tracked for performance (Closers, Setters).
*   **Leads & Students**: Your potential and active customers.
*   **Enrollments**: The link between a Student and a Program (Product).
*   **Finance**: Payments and Installments are tracked per Enrollment.
*   **Marketing**: Ad campaigns and Email broadcasts.

---

## Summary of Logic
*   **Leads** come in from **Ads**.
*   **Team Members** talk to Leads on **Sales Calls**.
*   If successful, the Lead becomes a **Student** and gets an **Enrollment** in a **Program**.
*   The Enrollment generates **Payments** (money) and **Installments** (future payments).
*   **Admins** and **Sales Reps** monitor these metrics to optimize the business.
