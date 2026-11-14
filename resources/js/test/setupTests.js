import '@testing-library/jest-dom/vitest';

if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.getItem) {
    const storage = {};
    globalThis.localStorage = {
        getItem: (key) => storage[key] ?? null,
        setItem: (key, val) => { storage[key] = String(val); },
        removeItem: (key) => { delete storage[key]; },
        clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
    };
}
