# Info Product Portal - Application Overview

## What is this App?
The **Info Product Portal** is a comprehensive management system designed for businesses that sell online courses, coaching programs, or other information products. It acts as the "central nervous system" for the business, bringing together sales, customer success, and marketing into one unified dashboard.

Instead of using scattered spreadsheets or disconnected tools, this portal allows the team to:
*   **Track Sales**: See leads, manage sales calls, and monitor revenue.
*   **Manage Students**: Oversee student enrollments, track their progress, and ensure they are successful.
*   **Monitor Performance**: Keep an eye on how well ads, emails, and individual team members are performing.

---

## How is it Structured?
The application is built using modern web technologies, split into two main parts that talk to each other:

1.  **The Frontend (What you see)**:
    *   Built with **React**, this is the visual interface where you click buttons, view charts, and enter data.
    *   It runs in your web browser and provides a smooth, app-like experience.
    *   It is organized into different "pages" for different roles (e.g., a "Sales" dashboard for closers, a "CSM" dashboard for customer success managers).

2.  **The Backend (The Brain)**:
    *   Built with **Node.js**, this runs on the server.
    *   It handles all the logic, calculations, and security.
    *   It connects to the **Database** to save and retrieve information.
    *   When you click "Save" on the frontend, it sends a message to the backend, which then updates the database.

---

## The Database: How the Logic Works
Think of the database as a giant, organized filing cabinet. Instead of random files, we have specific "Tables" (like folders) that hold related information. Here is how they connect:

### 1. The People
*   **Users**: These are the people who can log in to the portal (Admins, Sales Reps, Customer Success Managers).
*   **Team Members**: This tracks your staff specifically for performance (e.g., "John is a Closer"). We track their daily stats like calls booked and deals closed.
*   **Leads**: Potential customers who have expressed interest but haven't bought yet. We track their source (e.g., "Facebook Ad") and status (e.g., "Contacted").
*   **Students**: Leads who have successfully purchased a program. Once they buy, they become a "Student" in the system.

### 2. The Product & Sales
*   **Programs**: The actual products you are selling (e.g., "Masterclass 2024").
*   **Sales Calls**: Records of meetings between your team and leads. We track who hosted the call, who set the appointment, and the outcome (e.g., "Closed Won").

### 3. The "Enrollment" (The Core Connection)
This is the most important concept. An **Enrollment** is the link between a **Student** and a **Program**.
*   A student might buy one course now (one enrollment) and another course next year (a second enrollment).
*   The Enrollment holds all the specific details for *that* purchase:
    *   **Start Date**: When they joined.
    *   **Status**: Are they Active, Paused, or Completed?
    *   **Assignments**: Which CSM is helping them? Which Sales Rep closed the deal?

### 4. Money & Finance
Everything related to money is tied to the **Enrollment**.
*   **Payments**: Records of actual money received (e.g., "$1000 paid via Stripe").
*   **Installments**: If a student is on a payment plan, we create "Installment" records to track future due dates and amounts owed. This lets us easily see who is overdue.

### 5. Student Success (CSM)
To ensure students get results, we track their journey within their Enrollment:
*   **Onboarding State**: A checklist to ensure new students get set up correctly (e.g., "Joined Slack", "Watched Intro Video").
*   **Weekly Progress**: A weekly report card. Did they attend training? Did they complete their modules?
*   **Check-Ins**: Feedback forms submitted by students to tell us how they are feeling (Wins, Challenges, Satisfaction Score).

### 6. Marketing & Reporting
*   **Ad Campaigns**: Tracks your marketing campaigns on platforms like Facebook or Google.
*   **Ad Performance**: Daily stats for each campaign (Spend, Clicks, Leads, Revenue). This lets you calculate your Return on Ad Spend (ROAS).
*   **Email Broadcasts**: Tracks the newsletters you send out, including how many people opened them or clicked links.

---

## Summary of Logic
*   **Leads** come in from **Ads**.
*   **Team Members** talk to Leads on **Sales Calls**.
*   If successful, the Lead becomes a **Student** and gets an **Enrollment** in a **Program**.
*   The Enrollment generates **Payments** (money) and **Onboarding** tasks (work).
*   **CSMs** then manage the Enrollment by tracking **Weekly Progress** and **Check-Ins** to ensure the student stays happy and successful.
