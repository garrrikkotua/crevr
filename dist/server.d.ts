export declare class RevertServer {
    private app;
    private server;
    private wss;
    private parser;
    private tracker;
    private changes;
    private port;
    constructor(port?: number);
    private setupRoutes;
    private setupWebSocket;
    private handleGetChanges;
    private handleRevert;
    start(): Promise<unknown>;
    stop(): void;
}
//# sourceMappingURL=server.d.ts.map