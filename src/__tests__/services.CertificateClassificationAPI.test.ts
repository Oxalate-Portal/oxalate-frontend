import MockAdapter from "axios-mock-adapter";
import {certificateClassificationAPI} from "../services";

describe("CertificateClassificationAPI", () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(certificateClassificationAPI["axiosInstance"]);
    });

    afterEach(() => mock.reset());

    it("supports classification CRUD operations", async () => {
        const classification = {id: 1, titles: {en: "Cave"}, description: "Cave diving"};
        mock.onGet("").reply(200, [classification]);
        mock.onGet("/1").reply(200, classification);
        mock.onPost("", classification).reply(200, classification);
        mock.onPut("", classification).reply(200, classification);
        mock.onDelete("/1").reply(200);

        await expect(certificateClassificationAPI.findAll()).resolves.toEqual([classification]);
        await expect(certificateClassificationAPI.findById(1, null)).resolves.toEqual(classification);
        await expect(certificateClassificationAPI.create(classification)).resolves.toEqual(classification);
        await expect(certificateClassificationAPI.update(classification)).resolves.toEqual(classification);
        await expect(certificateClassificationAPI.delete(1)).resolves.toBe(true);
    });
});
