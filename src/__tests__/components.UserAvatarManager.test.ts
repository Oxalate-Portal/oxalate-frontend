import {getAvatarUploadOutcome} from "../tools/avatarUploadResponse";

describe("UserAvatarManager upload response handling", () => {
    it("returns success with url when backend response contains url", () => {
        expect(getAvatarUploadOutcome({url: "/api/files/avatars/100"})).toEqual({
            success: true,
            url: "/api/files/avatars/100"
        });
    });

    it("returns backend error when response contains error payload", () => {
        expect(getAvatarUploadOutcome({error: {message: "Could not upload file"}})).toEqual({
            success: false,
            message: "Could not upload file"
        });
    });

    it("returns generic failure when done response is malformed", () => {
        expect(getAvatarUploadOutcome({})).toEqual({success: false});
    });
});


