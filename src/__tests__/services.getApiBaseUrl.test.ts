import {resolveApiBaseUrl} from '../services/getApiBaseUrl';

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
});

