import {UserDocumentFiles} from "../components";
import {render} from "@testing-library/react";
import {fileTransferAPI} from "../services";

const translateMock = (key: string) => key;

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: translateMock
    })
}));

jest.mock("../session", () => ({
    useSession: () => ({
        getPortalConfigurationValue: () => "false"
    })
}));

describe("UserDocumentFiles feature gating", () => {
    it("does not request documents when documents feature is disabled", () => {
        const spy = jest.spyOn(fileTransferAPI, "findAllDocuments");

        const {container} = render(
                <UserDocumentFiles userId={1} creatorName={"Doe, Jane"} canUpload={true}/>
        );

        expect(container.firstChild).toBeNull();
        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
    });
});
