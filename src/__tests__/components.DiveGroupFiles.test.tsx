import {configure, fireEvent, render, screen, waitFor} from "@testing-library/react";
import axios from "axios";
import {DiveGroupFileList, DiveGroupTable, isImageDiveFile} from "../components";
import type {DiveFileResponse, DiveGroupResponse} from "../models";

jest.setTimeout(60000);

// Slow machines need more headroom than the 1 s default before waitFor/findBy give up
configure({asyncUtilTimeout: 10000});

jest.mock("../session", () => ({
    useSession: () => ({
        userSession: {id: 10},
        getPortalTimezone: () => "Europe/Helsinki"
    })
}));

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key
    })
}));

function diveFile(overrides: Partial<DiveFileResponse> = {}): DiveFileResponse {
    return {
        id: 100,
        filename: "dive-plan.pdf",
        creator: "Owner Ten",
        createdAt: "2026-05-30T12:00:00Z",
        mimetype: "application/pdf",
        filesize: 1234,
        filechecksum: "abc",
        url: "http://localhost/api/files/dive-files/100",
        eventId: 42,
        diveGroupId: 1,
        status: "UPLOADED",
        ...overrides
    } as unknown as DiveFileResponse;
}

function diveGroup(overrides: Partial<DiveGroupResponse> = {}): DiveGroupResponse {
    return {
        id: 1,
        eventId: 42,
        name: "Team Sidemount",
        ownerId: 10,
        ownerName: "Owner Ten",
        groupType: "NORMAL",
        groupOrder: 1,
        createdAt: "2026-05-30T12:00:00Z",
        updatedAt: null,
        members: [
            {userId: 10, name: "Owner Ten", userType: "SCUBA_DIVER", owner: true, joinedAt: "2026-05-30T12:00:00Z"}
        ],
        diveFiles: [],
        ...overrides
    } as unknown as DiveGroupResponse;
}

describe("isImageDiveFile", () => {
    it("detects an image dive file by its mime type", () => {
        expect(isImageDiveFile(diveFile({mimetype: "image/png"}))).toBe(true);
        expect(isImageDiveFile(diveFile({mimetype: "image/jpeg"}))).toBe(true);
    });

    it("does not treat other mime types as images", () => {
        expect(isImageDiveFile(diveFile({mimetype: "application/pdf"}))).toBe(false);
        expect(isImageDiveFile(diveFile({mimetype: undefined as never}))).toBe(false);
    });
});

describe("DiveGroupFileList", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders the empty text when the group has no dive files", () => {
        render(<DiveGroupFileList diveFiles={[]}/>);

        expect(screen.getByText("DiveEvent.diveGroup.files.empty")).toBeInTheDocument();
        expect(screen.queryByText("DiveEvent.diveGroup.files.title")).toBeNull();
    });

    it("renders a non-image dive file as a download link", () => {
        render(<DiveGroupFileList diveFiles={[diveFile()]}/>);

        expect(screen.getByText("DiveEvent.diveGroup.files.title")).toBeInTheDocument();
        const link = screen.getByText("dive-plan.pdf") as HTMLAnchorElement;
        expect(link.closest("a")).toHaveAttribute("href", "http://localhost/api/files/dive-files/100");
    });

    it("renders an image dive file with the protected image component", async () => {
        const createUrl = jest.fn().mockReturnValue("blob:dive-file");
        Object.defineProperty(URL, "createObjectURL", {value: createUrl, configurable: true});
        jest.spyOn(axios, "get").mockResolvedValue({data: new Blob(["image"])});

        render(<DiveGroupFileList
                diveFiles={[diveFile({id: 101, filename: "wreck.png", mimetype: "image/png", url: "http://localhost/api/files/dive-files/101"})]}/>);

        await waitFor(() => expect(screen.getByAltText("wreck.png")).toHaveAttribute("src", "blob:dive-file"));
        expect(axios.get).toHaveBeenCalledWith("http://localhost/api/files/dive-files/101", expect.objectContaining({responseType: "blob"}));
        delete (URL as unknown as { createObjectURL?: unknown }).createObjectURL;
    });

    it("renders a mix of image and other dive files", async () => {
        const createUrl = jest.fn().mockReturnValue("blob:dive-file");
        Object.defineProperty(URL, "createObjectURL", {value: createUrl, configurable: true});
        jest.spyOn(axios, "get").mockResolvedValue({data: new Blob(["image"])});

        render(<DiveGroupFileList diveFiles={[
            diveFile(),
            diveFile({id: 101, filename: "wreck.png", mimetype: "image/png", url: "http://localhost/api/files/dive-files/101"})
        ]}/>);

        expect(screen.getByText("dive-plan.pdf")).toBeInTheDocument();
        await waitFor(() => expect(screen.getByAltText("wreck.png")).toBeInTheDocument());
        delete (URL as unknown as { createObjectURL?: unknown }).createObjectURL;
    });
});

describe("DiveGroupTable group type and dive files", () => {
    const onJoin = jest.fn();
    const onLeave = jest.fn();
    const onDelete = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    function renderTable(diveGroups: DiveGroupResponse[]) {
        return render(<DiveGroupTable
                diveGroups={diveGroups}
                loading={false}
                currentUserId={99}
                canJoinDiveGroup={true}
                onJoin={onJoin}
                onLeave={onLeave}
                onDelete={onDelete}/>);
    }

    it("renders the group type column for a project group", () => {
        renderTable([diveGroup({groupType: "PROJECT" as never})]);

        expect(screen.getByText("DiveEvent.diveGroup.table.groupType")).toBeInTheDocument();
        expect(screen.getByText("DiveGroupTypeEnum.project")).toBeInTheDocument();
    });

    it("defaults the group type to normal when the backend does not provide one", () => {
        renderTable([diveGroup({groupType: undefined as never})]);

        expect(screen.getByText("DiveGroupTypeEnum.normal")).toBeInTheDocument();
    });

    it("shows that the group has uploaded dive files", () => {
        renderTable([diveGroup({diveFiles: [diveFile(), diveFile({id: 101})] as never})]);

        expect(screen.getByText("DiveEvent.diveGroup.table.diveFiles")).toBeInTheDocument();
        expect(screen.getByText("DiveEvent.diveGroup.files.uploaded (2)")).toBeInTheDocument();
    });

    it("shows that the group has no dive files", () => {
        renderTable([diveGroup({diveFiles: undefined as never})]);

        expect(screen.getByText("DiveEvent.diveGroup.files.none")).toBeInTheDocument();
    });

    it("shows the dive files of the group in the expanded row", async () => {
        renderTable([diveGroup({diveFiles: [diveFile()] as never})]);

        expect(screen.queryByText("dive-plan.pdf")).toBeNull();

        fireEvent.click(screen.getByLabelText("Expand row"));

        await waitFor(() => expect(screen.getByText("dive-plan.pdf")).toBeInTheDocument());
        expect(screen.getByText("DiveEvent.diveGroup.files.title")).toBeInTheDocument();
    });

    it("shows the empty file text in the expanded row when the group has no dive files", async () => {
        renderTable([diveGroup()]);

        fireEvent.click(screen.getByLabelText("Expand row"));

        await waitFor(() => expect(screen.getByText("DiveEvent.diveGroup.files.empty")).toBeInTheDocument());
    });
});
