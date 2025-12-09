import { app } from "./app";
import { registerRoutes } from "./routes";

// Initialize routes lazily
let routesRegistered = false;

export default async function handler(req: any, res: any) {
    // Health check endpoint to verify function execution
    if (req.url === '/api/health') {
        return res.status(200).json({ status: 'ok', time: new Date().toISOString() });
    }

    try {
        if (!routesRegistered) {
            await registerRoutes(app);
            routesRegistered = true;
        }
        app(req, res);
    } catch (error) {
        console.error("API Handler Error:", error);
        res.status(500).json({ error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) });
    }
}
