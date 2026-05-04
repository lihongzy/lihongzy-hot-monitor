const PLACEHOLDER_PATTERNS = [
    /^your_/i,
    /^sk-or-v1-你的/i,
    /^你的/i,
    /^notify_to@/i,
    /^smtp\.example\.com$/i
];
export function hasConfiguredEnv(value) {
    if (!value)
        return false;
    const normalized = value.trim();
    if (!normalized)
        return false;
    return !PLACEHOLDER_PATTERNS.some(pattern => pattern.test(normalized));
}
//# sourceMappingURL=env.js.map