import {type CkLoader, CKUploadAdapter} from "../services/CKUploadAdapter";

class MockXHR {
    responseType = "";
    withCredentials = false;
    response: unknown;
    upload = {addEventListener: jest.fn()};
    open = jest.fn();
    send = jest.fn();
    abort = jest.fn();
    private listeners: Record<string, () => void> = {};
    addEventListener = jest.fn((name: string, listener: () => void) => {
        this.listeners[name] = listener;
    });

    trigger(name: string) {
        this.listeners[name]?.();
    }
}

describe("CKUploadAdapter behavior", () => {
    let xhr: MockXHR;
    let loader: CkLoader;

    beforeEach(() => {
        xhr = new MockXHR();
        loader = {file: Promise.resolve(new File(["content"], "photo.png", {type: "image/png"}))};
        jest.spyOn(window, "XMLHttpRequest").mockImplementation(() => xhr as unknown as XMLHttpRequest);
    });

    afterEach(() => jest.restoreAllMocks());

    it("opens a credentialed request with encoded language and page id and uploads the file", async () => {
        const adapter = new CKUploadAdapter(loader, "fi FI", 42, "https://example.test/upload");
        const promise = adapter.upload();
        expect(xhr.open).toHaveBeenCalledWith("POST", "https://example.test/upload?language=fi+FI&pageId=42", true);
        expect(xhr.responseType).toBe("json");
        expect(xhr.withCredentials).toBe(true);
        await Promise.resolve();
        expect(xhr.send).toHaveBeenCalledWith(expect.any(FormData));
        xhr.response = {url: "https://example.test/photo.png"};
        xhr.trigger("load");
        await expect(promise).resolves.toEqual({default: "https://example.test/photo.png"});
    });

    it.each([
        ["network errors", "error", undefined, "Couldn't upload file."],
        ["server error messages", "load", {error: {message: "Rejected"}}, "Rejected"],
        ["missing response URLs", "load", {}, "Couldn't upload file."]
    ])("rejects on %s", async (_, event, response, expected) => {
        const adapter = new CKUploadAdapter(loader, "en", 1, "/upload");
        const promise = adapter.upload();
        xhr.response = response;
        xhr.trigger(event);
        await expect(promise).rejects.toBe(expected);
    });

    it("rejects when the request is aborted and aborts an active request", async () => {
        const adapter = new CKUploadAdapter(loader, "en", 1, "/upload");
        const promise = adapter.upload();
        adapter.abort();
        expect(xhr.abort).toHaveBeenCalledTimes(1);
        xhr.trigger("abort");
        await expect(promise).rejects.toBeUndefined();
    });

    it("updates loader progress for computable progress events", async () => {
        const adapter = new CKUploadAdapter(loader, "en", 1, "/upload");
        adapter.upload();
        const progress = xhr.upload.addEventListener.mock.calls[0][1] as (event: ProgressEvent) => void;
        progress({lengthComputable: true, total: 100, loaded: 25} as ProgressEvent);
        expect(loader.uploadTotal).toBe(100);
        expect(loader.uploaded).toBe(25);
    });
});
