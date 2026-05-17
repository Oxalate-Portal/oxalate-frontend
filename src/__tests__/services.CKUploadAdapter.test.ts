import {CKUploadAdapter} from '../services';
import type {CkLoader} from '../services/CKUploadAdapter';

describe('CKUploadAdapter', () => {
    let adapter: CKUploadAdapter;
    let mockLoader: CkLoader;

    beforeEach(() => {
        mockLoader = {
            file: Promise.resolve(new File(['test content'], 'test.jpg', {type: 'image/jpeg'})),
            uploadTotal: 0,
            uploaded: 0
        };
    });

    afterEach(() => {
        if (adapter) {
            adapter.abort();
        }
    });

    it('should initialize with correct parameters', () => {
        adapter = new CKUploadAdapter(mockLoader, 'en', 1, 'http://api.example.com/upload');
        expect(adapter).toBeDefined();
    });

    it('should create adapter with different languages', () => {
        const languages = ['en', 'fi', 'sv', 'de', 'es'];
        languages.forEach(lang => {
            const testAdapter = new CKUploadAdapter(mockLoader, lang, 1, 'http://api.example.com/upload');
            expect(testAdapter).toBeDefined();
        });
    });

    it('should create adapter with different page ids', () => {
        const pageIds = [1, 2, 100, 999];
        pageIds.forEach(pageId => {
            const testAdapter = new CKUploadAdapter(mockLoader, 'en', pageId, 'http://api.example.com/upload');
            expect(testAdapter).toBeDefined();
        });
    });

    it('should have abort method', () => {
        adapter = new CKUploadAdapter(mockLoader, 'en', 1, 'http://api.example.com/upload');
        expect(adapter.abort).toBeDefined();
        expect(typeof adapter.abort).toBe('function');
    });

    it('should have upload method', () => {
        adapter = new CKUploadAdapter(mockLoader, 'en', 1, 'http://api.example.com/upload');
        expect(adapter.upload).toBeDefined();
        expect(typeof adapter.upload).toBe('function');
    });
});

