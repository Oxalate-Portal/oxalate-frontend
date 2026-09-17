import {configure, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {
    DEFAULT_DIVE_GROUP_DESCRIPTION_MAX_LENGTH,
    DIVE_GROUP_DESCRIPTION_MAX_LENGTH_KEY,
    DiveGroupDetailsModal,
    resolveDiveGroupDescriptionMaxLength
} from "../components";
import type {DiveGroupResponse} from "../models";

jest.setTimeout(60000);
configure({asyncUtilTimeout: 10000});

const mockUpdateDiveGroupDetails = jest.fn();
const mockFrontendConfiguration = jest.fn<string, [key: string]>(() => "");

jest.mock("../services", () => ({
    diveGroupAPI: {
        updateDiveGroupDetails: (...args: unknown[]) => mockUpdateDiveGroupDetails(...args)
    }
}));

jest.mock("../session", () => ({
    useSession: () => ({
        userSession: {id: 10},
        getFrontendConfigurationValue: (key: string) => mockFrontendConfiguration(key)
    })
}));

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, options?: Record<string, unknown>) => options?.max !== undefined ? key + ":" + options.max : key
    })
}));

function diveGroup(overrides: Partial<DiveGroupResponse> = {}): DiveGroupResponse {
    return {
        id: 7,
        eventId: 42,
        name: "Team Sidemount",
        description: "Old plan",
        ownerId: 10,
        ownerName: "Owner Ten",
        groupOrder: 1,
        createdAt: "2026-05-30T12:00:00Z",
        updatedAt: null,
        members: [],
        diveFiles: [],
        ...overrides
    } as unknown as DiveGroupResponse;
}

describe("resolveDiveGroupDescriptionMaxLength", () => {
    it("uses the configured positive integer", () => {
        expect(resolveDiveGroupDescriptionMaxLength("500")).toBe(500);
    });

    it("falls back to the default for missing, empty, non-numeric and non-positive values", () => {
        expect(resolveDiveGroupDescriptionMaxLength(undefined)).toBe(DEFAULT_DIVE_GROUP_DESCRIPTION_MAX_LENGTH);
        expect(resolveDiveGroupDescriptionMaxLength(null)).toBe(DEFAULT_DIVE_GROUP_DESCRIPTION_MAX_LENGTH);
        expect(resolveDiveGroupDescriptionMaxLength("")).toBe(DEFAULT_DIVE_GROUP_DESCRIPTION_MAX_LENGTH);
        expect(resolveDiveGroupDescriptionMaxLength("abc")).toBe(DEFAULT_DIVE_GROUP_DESCRIPTION_MAX_LENGTH);
        expect(resolveDiveGroupDescriptionMaxLength("0")).toBe(DEFAULT_DIVE_GROUP_DESCRIPTION_MAX_LENGTH);
        expect(resolveDiveGroupDescriptionMaxLength("-5")).toBe(DEFAULT_DIVE_GROUP_DESCRIPTION_MAX_LENGTH);
    });

    it("exposes the frontend configuration key the backend seeds", () => {
        expect(DIVE_GROUP_DESCRIPTION_MAX_LENGTH_KEY).toBe("dive-group-description-max-length");
        expect(DEFAULT_DIVE_GROUP_DESCRIPTION_MAX_LENGTH).toBe(8000);
    });
});

describe("DiveGroupDetailsModal", () => {
    const onCancel = jest.fn();
    const onUpdated = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockFrontendConfiguration.mockImplementation(() => "");
    });

    function renderModal(open = true, group: DiveGroupResponse | null = diveGroup()) {
        return render(<DiveGroupDetailsModal open={open} diveGroup={group} onCancel={onCancel} onUpdated={onUpdated}/>);
    }

    function nameInput(): HTMLInputElement {
        return screen.getByPlaceholderText("DiveEvent.diveGroup.form.name.placeholder") as HTMLInputElement;
    }

    function descriptionInput(): HTMLTextAreaElement {
        return screen.getByPlaceholderText("DiveEvent.diveGroup.form.description.placeholder") as HTMLTextAreaElement;
    }

    it("renders nothing when closed", () => {
        renderModal(false);

        expect(screen.queryByText("DiveEvent.diveGroup.edit.title")).toBeNull();
    });

    it("prefills the form with the current name and description", async () => {
        renderModal();

        await waitFor(() => expect(nameInput().value).toBe("Team Sidemount"));
        expect(descriptionInput().value).toBe("Old plan");
    });

    it("prefills an empty description when the group has none", async () => {
        renderModal(true, diveGroup({description: null}));

        await waitFor(() => expect(nameInput().value).toBe("Team Sidemount"));
        expect(descriptionInput().value).toBe("");
    });

    it("limits the description to the configured maximum length", () => {
        mockFrontendConfiguration.mockImplementation((key: string) => key === "dive-group-description-max-length" ? "50" : "");

        renderModal();

        expect(descriptionInput()).toHaveAttribute("maxlength", "50");
    });

    it("limits the description to the default when nothing is configured", () => {
        renderModal();

        expect(descriptionInput()).toHaveAttribute("maxlength", String(DEFAULT_DIVE_GROUP_DESCRIPTION_MAX_LENGTH));
    });

    it("saves the new name and trimmed description", async () => {
        const updated = diveGroup({name: "Renamed", description: "New plan"});
        mockUpdateDiveGroupDetails.mockResolvedValue(updated);

        renderModal();
        await waitFor(() => expect(nameInput().value).toBe("Team Sidemount"));

        fireEvent.change(nameInput(), {target: {value: "Renamed"}});
        fireEvent.change(descriptionInput(), {target: {value: "  New plan  "}});
        fireEvent.click(screen.getByText("DiveEvent.diveGroup.edit.submit"));

        await waitFor(() => expect(mockUpdateDiveGroupDetails).toHaveBeenCalledWith(7, {name: "Renamed", description: "New plan"}));
        await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updated));
    });

    it("sends a null description when the field is cleared", async () => {
        mockUpdateDiveGroupDetails.mockResolvedValue(diveGroup({description: null}));

        renderModal();
        await waitFor(() => expect(descriptionInput().value).toBe("Old plan"));

        fireEvent.change(descriptionInput(), {target: {value: "   "}});
        fireEvent.click(screen.getByText("DiveEvent.diveGroup.edit.submit"));

        await waitFor(() => expect(mockUpdateDiveGroupDetails).toHaveBeenCalledWith(7, {name: "Team Sidemount", description: null}));
    });

    it("validates that the name is required", async () => {
        renderModal();
        await waitFor(() => expect(nameInput().value).toBe("Team Sidemount"));

        fireEvent.change(nameInput(), {target: {value: "   "}});
        fireEvent.click(screen.getByText("DiveEvent.diveGroup.edit.submit"));

        await waitFor(() => expect(screen.getByText("DiveEvent.diveGroup.form.name.rules.required")).toBeInTheDocument());
        expect(mockUpdateDiveGroupDetails).not.toHaveBeenCalled();
    });

    it("validates the maximum length of the name", async () => {
        renderModal();
        await waitFor(() => expect(nameInput().value).toBe("Team Sidemount"));

        fireEvent.change(nameInput(), {target: {value: "x".repeat(256)}});
        fireEvent.click(screen.getByText("DiveEvent.diveGroup.edit.submit"));

        await waitFor(() => expect(screen.getByText("DiveEvent.diveGroup.form.name.rules.maxLength")).toBeInTheDocument());
        expect(mockUpdateDiveGroupDetails).not.toHaveBeenCalled();
    });

    it("shows a translated error and keeps the modal open when saving fails", async () => {
        mockUpdateDiveGroupDetails.mockRejectedValue(new Error("boom"));
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);

        renderModal();
        await waitFor(() => expect(nameInput().value).toBe("Team Sidemount"));

        fireEvent.click(screen.getByText("DiveEvent.diveGroup.edit.submit"));

        await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("DiveEvent.diveGroup.error.update"));
        expect(onUpdated).not.toHaveBeenCalled();
        expect(screen.getByText("DiveEvent.diveGroup.edit.title")).toBeInTheDocument();
        consoleError.mockRestore();
    });

    it("does not submit when no dive group is selected", async () => {
        renderModal(true, null);

        fireEvent.change(nameInput(), {target: {value: "Renamed"}});
        fireEvent.click(screen.getByText("DiveEvent.diveGroup.edit.submit"));

        await waitFor(() => expect(nameInput().value).toBe("Renamed"));
        expect(mockUpdateDiveGroupDetails).not.toHaveBeenCalled();
    });

    it("resets the form and reports cancel", async () => {
        renderModal();
        await waitFor(() => expect(nameInput().value).toBe("Team Sidemount"));

        fireEvent.click(screen.getByText("common.button.cancel"));

        expect(onCancel).toHaveBeenCalled();
        expect(mockUpdateDiveGroupDetails).not.toHaveBeenCalled();
    });
});
