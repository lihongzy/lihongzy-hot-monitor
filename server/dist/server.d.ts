export declare function startServer(): Promise<{
    app: import("express-serve-static-core").Express;
    httpServer: import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>;
    io: import("socket.io").Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
    scheduler: import("node-cron").ScheduledTask;
}>;
//# sourceMappingURL=server.d.ts.map