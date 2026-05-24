import {resolveCommentAvatarUrl} from "../tools/commentAvatarUrl";

describe("resolveCommentAvatarUrl", () => {
    it("returns null when avatarUrl is nullish or empty", () => {
        expect(resolveCommentAvatarUrl(undefined, "http://localhost:8080/api")).toBeNull();
        expect(resolveCommentAvatarUrl(null, "http://localhost:8080/api")).toBeNull();
        expect(resolveCommentAvatarUrl("   ", "http://localhost:8080/api")).toBeNull();
    });

    it("keeps absolute avatar URLs unchanged", () => {
        expect(resolveCommentAvatarUrl("http://localhost:8080/api/files/avatars/1", "http://example.com/api"))
            .toBe("http://localhost:8080/api/files/avatars/1");
    });

    it("resolves backend-relative avatar URLs using API base origin", () => {
        expect(resolveCommentAvatarUrl("/api/files/avatars/1", "http://localhost:8080/api"))
            .toBe("http://localhost:8080/api/files/avatars/1");
    });

    it("falls back to the raw URL when API base URL is missing", () => {
        expect(resolveCommentAvatarUrl("/api/files/avatars/1", "")).toBe("/api/files/avatars/1");
    });
});

