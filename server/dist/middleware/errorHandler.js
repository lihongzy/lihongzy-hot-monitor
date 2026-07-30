export const notFoundHandler = (req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
};
export const errorHandler = (error, _req, res, _next) => {
    console.error('Unhandled server error:', error);
    res.status(500).json({ error: 'Internal server error' });
};
//# sourceMappingURL=errorHandler.js.map