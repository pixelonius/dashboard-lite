import { app } from "../server/app";
import { registerRoutes } from "../server/routes";

// Register routes on the app instance
// Note: registerRoutes returns a promise of the HTTP server, 
// but we only need the side effect of routes being registered on 'app'.
registerRoutes(app);

// Export the app for Vercel
export default app;
