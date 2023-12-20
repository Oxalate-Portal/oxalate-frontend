interface PageVersionResponse {
    id: number;
    pageId: number;
    language: string;
    title: string;
    ingress: string;
    body: string;
}

export default PageVersionResponse;