/**
 * Modified adapter which includes the pageId and language in the upload request
 */

type CkLoader = {
    file: Promise<File>;
    uploadTotal?: number;
    uploaded?: number;
};

type CkUploadResponse = {
    url?: string;
    error?: { message?: string };
};

export class CKUploadAdapter {
    private loader: CkLoader;
    private url: string;
    private language: string;
    private pageId: number;
    private xhr: XMLHttpRequest | null = null;

    constructor(loader: CkLoader, language: string, pageId: number, url: string) {
        this.loader = loader;
        this.language = language;
        this.pageId = pageId;
        this.url = url;
    }

    upload(): Promise<{ default: string }> {
        return new Promise((resolve, reject) => {
            this._initRequest();
            this._initListeners(resolve, reject);
            this._sendRequest();
        });
    }

    abort(): void {
        if (this.xhr) {
            this.xhr.abort();
        }
    }

    private _initRequest(): void {
        const xhr = (this.xhr = new XMLHttpRequest());

        // Create query parameters
        const params = new URLSearchParams({
            language: this.language,
            pageId: this.pageId.toString(),
        });

        // Append parameters to URL
        const urlWithParams = `${this.url}?${params.toString()}`;

        xhr.open("POST", urlWithParams, true);
        xhr.responseType = "json";

        xhr.withCredentials = true;
    }

    private _initListeners(
            resolve: (value: { default: string }) => void,
            reject: (reason?: string) => void
    ): void {
        const xhr = this.xhr!;
        const loader = this.loader;
        const genericErrorText = "Couldn't upload file.";

        xhr.addEventListener("error", () => reject(genericErrorText));
        xhr.addEventListener("abort", () => reject());
        xhr.addEventListener("load", () => {
            const response = xhr.response as CkUploadResponse;

            if (!response || response.error) {
                return reject(response?.error?.message || genericErrorText);
            }

            if (!response.url) {
                return reject(genericErrorText);
            }

            resolve({default: response.url});
        });

        if (xhr.upload) {
            xhr.upload.addEventListener("progress", (evt: ProgressEvent) => {
                if (evt.lengthComputable) {
                    loader.uploadTotal = evt.total;
                    loader.uploaded = evt.loaded;
                }
            });
        }
    }

    private async _sendRequest(): Promise<void> {
        const data = new FormData();
        const file = await this.loader.file;

        data.append("uploadFile", file);
        this.xhr!.send(data);
    }
}
