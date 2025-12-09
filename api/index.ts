
import { app } from "../server/app";
import { registerRoutes } from "../server/routes";

// Initialize routes
// Note: We use top-level await which is supported in Node.js modules and Vercel
await registerRoutes(app);

// Export the app for Vercel Serverless Functions
export default app;
