import { app } from "../server/app";
import { registerRoutes } from "../server/routes";

// Initialize routes lazily
let routesRegistered = false;

export default async function handler(req: any, res: any) {
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
