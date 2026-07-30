import './config/env.js';
import { startServer } from './server.js';
startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exitCode = 1;
});
//# sourceMappingURL=index.js.map