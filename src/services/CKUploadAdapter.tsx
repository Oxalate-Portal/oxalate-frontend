/**
 * Created because the moronic maintainers of CKFinder are incapable of adding user-defined header in their upload adapter.
 */

export class CKUploadAdapter {
    private loader: any;
    private url: string;
    private token: string;
    private language: string;
    private pageId: number;

    private xhr: XMLHttpRequest | null = null;

    constructor(loader: any, language: string, pageId: number, token: string, url: string) {
        this.loader = loader;
        this.language = language;
        this.pageId = pageId;
        this.token = token;
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
        const xhr = this.xhr = new XMLHttpRequest();

        // Create an instance of URLSearchParams
        const params = new URLSearchParams({
            language: this.language,
            pageId: this.pageId.toString(),  // Convert pageId to string if it's a number
        });

        // Append the parameters to the base URL
        const urlWithParams = `${this.url}?${params.toString()}`;

        xhr.open("POST", urlWithParams, true);
        xhr.responseType = "json";

        xhr.setRequestHeader("Authorization", "Bearer " + this.token);
    }

    private _initListeners(resolve: (value: { default: string }) => void, reject: (reason?: any) => void): void {
        const xhr = this.xhr!;
        const loader = this.loader;
        const genericErrorText = `Couldn't upload file: ${loader.file?.name}.`;

        xhr.addEventListener("error", () => reject(genericErrorText));
        xhr.addEventListener("abort", () => reject());
        xhr.addEventListener("load", () => {
            const response = xhr.response;

            if (!response || response.error) {
                return reject(response && response.error ? response.error.message : genericErrorText);
            }

            // If the upload is successful, resolve the upload promise with an object containing
            // at least the "default" URL, pointing to the image on the server.
            resolve({
                default: response.url
            });
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
        // Resolve the file promise before appending
        const file = await this.loader.file;

        data.append("upload", file);
        this.xhr!.send(data);
    }
}
