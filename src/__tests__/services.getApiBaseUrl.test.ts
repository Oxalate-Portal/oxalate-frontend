import {getApiBaseUrl, resolveApiBaseUrl} from '../services/getApiBaseUrl';

describe('resolveApiBaseUrl', () => {
    it('prefers explicit global, then Vite env, then process env, then same-origin fallback', () => {
        expect(resolveApiBaseUrl({
            globalUrl: 'https://global.example/api',
            importMetaUrl: 'https://vite.example/api',
            processUrl: 'https://process.example/api'
        })).toBe('https://global.example/api');

        expect(resolveApiBaseUrl({
            importMetaUrl: 'https://vite.example/api',
            processUrl: 'https://process.example/api'
        })).toBe('https://vite.example/api');

        expect(resolveApiBaseUrl({
            processUrl: 'https://process.example/api'
        })).toBe('https://process.example/api');

        expect(resolveApiBaseUrl({})).toBe('');
    });

    it('normalizes whitespace and trailing slashes', () => {
        expect(resolveApiBaseUrl({globalUrl: ' https://global.example/api/// '})).toBe('https://global.example/api');
    });
});

describe('getApiBaseUrl', () => {
    const globalWithApi = globalThis as { __OXALATE_API_URL__?: string };
    const originalGlobalApiUrl = globalWithApi.__OXALATE_API_URL__;
    const originalProcessApiUrl = process.env.VITE_APP_API_URL;

    afterEach(() => {
        globalWithApi.__OXALATE_API_URL__ = originalGlobalApiUrl;
        process.env.VITE_APP_API_URL = originalProcessApiUrl;
    });

    it('uses global URL first and normalizes value', () => {
        globalWithApi.__OXALATE_API_URL__ = ' http://localhost:8080/api/// ';
        process.env.VITE_APP_API_URL = 'http://localhost:8080/other';

        expect(getApiBaseUrl()).toBe('http://localhost:8080/api');
    });

    it('falls back to process env when global URL is missing', () => {
        delete globalWithApi.__OXALATE_API_URL__;
        process.env.VITE_APP_API_URL = 'http://localhost:8080/api';

        expect(getApiBaseUrl()).toBe('http://localhost:8080/api');
    });
});

