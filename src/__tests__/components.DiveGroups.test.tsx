import {act, fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {
    DiveGroupFormModal,
    DiveGroupTable,
    findDiveGroupOfUser,
    findDiveGroupOwnedByUser,
    isMemberOfDiveGroup,
    moveDiveGroup,
    sortDiveGroupsByOrder
} from "../components";
import type {DiveGroupResponse, ListUserResponse} from "../models";

const mockCreateDiveGroup = jest.fn();

jest.mock("../services", () => ({
    diveGroupAPI: {
        createDiveGroup: (...args: unknown[]) => mockCreateDiveGroup(...args)
    }
}));

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

function diveGroup(overrides: Partial<DiveGroupResponse> = {}): DiveGroupResponse {
    return {
        id: 1,
        eventId: 42,
        name: "Team Sidemount",
        ownerId: 10,
        ownerName: "Owner Ten",
        groupOrder: 1,
        createdAt: "2026-05-30T12:00:00Z",
        updatedAt: null,
        members: [
            {userId: 10, name: "Owner Ten", userType: "SCUBA_DIVER", owner: true, joinedAt: "2026-05-30T12:00:00Z"}
        ],
        ...overrides
    } as unknown as DiveGroupResponse;
}

const participants = [
    {id: 10, name: "Owner Ten"},
    {id: 20, name: "Diver Twenty"}
] as unknown as ListUserResponse[];

describe("dive group helpers", () => {
    it("detects membership of a dive group", () => {
        expect(isMemberOfDiveGroup(diveGroup(), 10)).toBe(true);
        expect(isMemberOfDiveGroup(diveGroup(), 99)).toBe(false);
    });

    it("tolerates a dive group without a member list", () => {
        expect(isMemberOfDiveGroup(diveGroup({members: undefined as never}), 10)).toBe(false);
    });

    it("finds the dive group a user belongs to", () => {
        const groups = [diveGroup({id: 1}), diveGroup({
            id: 2,
            ownerId: 20,
            members: [{userId: 20, name: "Diver Twenty", userType: "SCUBA_DIVER", owner: true, joinedAt: null}] as never
        })];

        expect(findDiveGroupOfUser(groups, 20)?.id).toBe(2);
        expect(findDiveGroupOfUser(groups, 99)).toBeNull();
    });

    it("finds the dive group a user owns", () => {
        const groups = [diveGroup({id: 1, ownerId: 10}), diveGroup({id: 2, ownerId: 20})];

        expect(findDiveGroupOwnedByUser(groups, 20)?.id).toBe(2);
        expect(findDiveGroupOwnedByUser(groups, 99)).toBeNull();
    });

    it("sorts the dive groups by their order without mutating the input", () => {
        const groups = [diveGroup({id: 1, groupOrder: 3}), diveGroup({id: 2, groupOrder: 1}), diveGroup({id: 3, groupOrder: 2})];

        expect(sortDiveGroupsByOrder(groups).map((group) => group.id)).toEqual([2, 3, 1]);
        expect(groups.map((group) => group.id)).toEqual([1, 2, 3]);
    });

    it("keeps the received order when the groups have no order", () => {
        const groups = [diveGroup({id: 5, groupOrder: undefined as never}), diveGroup({id: 6, groupOrder: undefined as never})];

        expect(sortDiveGroupsByOrder(groups).map((group) => group.id)).toEqual([5, 6]);
    });

    it("moves a dive group to the position of the drop target", () => {
        const groups = [diveGroup({id: 1}), diveGroup({id: 2}), diveGroup({id: 3})];

        expect(moveDiveGroup(groups, 3, 1).map((group) => group.id)).toEqual([3, 1, 2]);
        expect(moveDiveGroup(groups, 1, 3).map((group) => group.id)).toEqual([2, 3, 1]);
    });

    it("returns the same list when the move changes nothing", () => {
        const groups = [diveGroup({id: 1}), diveGroup({id: 2})];

        expect(moveDiveGroup(groups, 1, 1)).toBe(groups);
        expect(moveDiveGroup(groups, 99, 1)).toBe(groups);
        expect(moveDiveGroup(groups, 1, 99)).toBe(groups);
    });
});

describe("DiveGroupTable", () => {
    const onJoin = jest.fn();
    const onLeave = jest.fn();
    const onDelete = jest.fn();
    const onReorder = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    function renderTable(diveGroups: DiveGroupResponse[], currentUserId: number, canJoinDiveGroup = true, canReorderDiveGroups = false) {
        return render(<DiveGroupTable
                diveGroups={diveGroups}
                loading={false}
                currentUserId={currentUserId}
                canJoinDiveGroup={canJoinDiveGroup}
                canReorderDiveGroups={canReorderDiveGroups}
                onJoin={onJoin}
                onLeave={onLeave}
                onDelete={onDelete}
                onReorder={onReorder}/>);
    }

    function rowOf(name: string): HTMLElement {
        return screen.getByText(name).closest("tr") as HTMLElement;
    }

    function renderedGroupNames(): string[] {
        return Array.from(document.querySelectorAll("tbody.ant-table-tbody tr td:nth-child(3)"))
                .map((cell) => cell.textContent ?? "");
    }

    function dragRowOnto(sourceName: string, targetName: string) {
        fireEvent.dragStart(rowOf(sourceName));
        fireEvent.dragOver(rowOf(targetName));
        fireEvent.drop(rowOf(targetName));
    }

    it("renders the dive group with its name, owner and member count", () => {
        renderTable([diveGroup()], 99);

        expect(screen.getByText("DiveEvent.diveGroup.table.title")).toBeInTheDocument();
        expect(screen.getByText("Team Sidemount")).toBeInTheDocument();
        expect(screen.getByText("Owner Ten")).toBeInTheDocument();
        // The order column and the member count column both render a 1 for a single group with a single member
        expect(screen.getAllByText("1")).toHaveLength(2);
    });

    it("renders an empty owner name when the group has none", () => {
        renderTable([diveGroup({ownerName: null})], 99);

        expect(screen.getByText("Team Sidemount")).toBeInTheDocument();
    });

    it("shows the join button for a user who belongs to no group", () => {
        renderTable([diveGroup()], 99);

        fireEvent.click(screen.getByText("DiveEvent.diveGroup.table.joinButton"));

        expect(onJoin).toHaveBeenCalledWith(1);
        expect(screen.queryByText("DiveEvent.diveGroup.table.leaveButton")).toBeNull();
        expect(screen.queryByText("DiveEvent.diveGroup.table.deleteButton")).toBeNull();
    });

    it("hides the join button when the user is not participating in the event", () => {
        renderTable([diveGroup()], 99, false);

        expect(screen.queryByText("DiveEvent.diveGroup.table.joinButton")).toBeNull();
    });

    it("hides the join button when the user already belongs to another group of the event", () => {
        const groups = [
            diveGroup({id: 1}),
            diveGroup({
                id: 2,
                name: "Team Backmount",
                ownerId: 20,
                ownerName: "Diver Twenty",
                members: [{userId: 99, name: "Me", userType: "SCUBA_DIVER", owner: false, joinedAt: null}] as never
            })
        ];

        renderTable(groups, 99);

        expect(screen.queryByText("DiveEvent.diveGroup.table.joinButton")).toBeNull();
        expect(screen.getByText("DiveEvent.diveGroup.table.leaveButton")).toBeInTheDocument();
    });

    it("shows the leave button for a member who is not the owner", () => {
        const group = diveGroup({
            members: [
                {userId: 10, name: "Owner Ten", userType: "SCUBA_DIVER", owner: true, joinedAt: null},
                {userId: 99, name: "Me", userType: "FREE_DIVER", owner: false, joinedAt: null}
            ] as never
        });

        renderTable([group], 99);

        fireEvent.click(screen.getByText("DiveEvent.diveGroup.table.leaveButton"));

        expect(onLeave).toHaveBeenCalledWith(1);
    });

    it("shows the delete button for the owner and deletes after confirmation", async () => {
        renderTable([diveGroup()], 10);

        expect(screen.queryByText("DiveEvent.diveGroup.table.joinButton")).toBeNull();
        expect(screen.queryByText("DiveEvent.diveGroup.table.leaveButton")).toBeNull();

        fireEvent.click(screen.getByText("DiveEvent.diveGroup.table.deleteButton"));

        await waitFor(() => expect(screen.getByText("DiveEvent.diveGroup.table.deleteConfirm")).toBeInTheDocument());

        const popconfirm = screen.getByText("DiveEvent.diveGroup.table.deleteConfirm").closest(".ant-popover") as HTMLElement;
        fireEvent.click(within(popconfirm).getByText("common.button.yes"));

        await waitFor(() => expect(onDelete).toHaveBeenCalledWith(1));
    });

    it("expands the row to show the members of the group", async () => {
        const group = diveGroup({
            members: [
                {userId: 10, name: "Owner Ten", userType: "SCUBA_DIVER", owner: true, joinedAt: "2026-05-30T12:00:00Z"},
                {userId: 20, name: "Diver Twenty", userType: "SNORKLER", owner: false, joinedAt: null}
            ] as never
        });

        renderTable([group], 99);

        expect(screen.queryByText("DiveEvent.diveGroup.members.name")).toBeNull();

        fireEvent.click(screen.getByLabelText("Expand row"));

        await waitFor(() => expect(screen.getByText("DiveEvent.diveGroup.members.name")).toBeInTheDocument());
        expect(screen.getByText("Diver Twenty")).toBeInTheDocument();
        expect(screen.getByText("UserTypeEnum.scuba_diver")).toBeInTheDocument();
        expect(screen.getByText("UserTypeEnum.snorkler")).toBeInTheDocument();
        // Owner column renders yes for the owner and no for the other member
        expect(screen.getByText("common.button.yes")).toBeInTheDocument();
        expect(screen.getByText("common.button.no")).toBeInTheDocument();
        // joinedAt is rendered in the portal timezone, and blank when missing
        expect(screen.getByText("2026-05-30 15:00")).toBeInTheDocument();
    });

    it("renders the empty member text when the group has no members", async () => {
        renderTable([diveGroup({members: [] as never})], 99);

        fireEvent.click(screen.getByLabelText("Expand row"));

        await waitFor(() => expect(screen.getByText("DiveEvent.diveGroup.members.empty")).toBeInTheDocument());
    });

    it("tolerates a dive group that has no member list at all", async () => {
        renderTable([diveGroup({members: undefined as never})], 99);

        expect(screen.getByText("0")).toBeInTheDocument();

        fireEvent.click(screen.getByLabelText("Expand row"));

        await waitFor(() => expect(screen.getByText("DiveEvent.diveGroup.members.empty")).toBeInTheDocument());
    });

    // ------------------------------------------------------------------
    // Dive group order
    // ------------------------------------------------------------------

    const orderedGroups = () => [
        diveGroup({id: 1, name: "Team One", groupOrder: 1, ownerId: 10, ownerName: "Owner Ten"}),
        diveGroup({id: 2, name: "Team Two", groupOrder: 2, ownerId: 20, ownerName: "Owner Twenty"}),
        diveGroup({id: 3, name: "Team Three", groupOrder: 3, ownerId: 30, ownerName: "Owner Thirty"})
    ];

    it("renders the dive groups in the order set by the organizer", () => {
        const groups = [
            diveGroup({id: 1, name: "Team One", groupOrder: 3}),
            diveGroup({id: 2, name: "Team Two", groupOrder: 1}),
            diveGroup({id: 3, name: "Team Three", groupOrder: 2})
        ];

        renderTable(groups, 99);

        expect(renderedGroupNames()).toEqual(["Team Two", "Team Three", "Team One"]);
    });

    it("does not make the rows draggable for a user who may not reorder", () => {
        renderTable(orderedGroups(), 99);

        expect(rowOf("Team One")).not.toHaveAttribute("draggable");
        expect(screen.getByText("DiveEvent.diveGroup.table.title")).toBeInTheDocument();
    });

    it("does not offer reordering when there is only a single dive group", () => {
        renderTable([diveGroup({id: 1, name: "Team One"})], 99, true, true);

        expect(rowOf("Team One")).not.toHaveAttribute("draggable");
    });

    it("makes the rows draggable and shows the hint for the organizer", () => {
        renderTable(orderedGroups(), 99, true, true);

        expect(rowOf("Team One")).toHaveAttribute("draggable", "true");
        expect(screen.getByText("DiveEvent.diveGroup.table.title - DiveEvent.diveGroup.table.reorderHint")).toBeInTheDocument();
    });

    it("reorders the dive groups by dragging a row onto another one", () => {
        renderTable(orderedGroups(), 99, true, true);

        dragRowOnto("Team Three", "Team One");

        expect(renderedGroupNames()).toEqual(["Team Three", "Team One", "Team Two"]);
        expect(onReorder).toHaveBeenCalledWith([3, 1, 2]);
    });

    it("renumbers the order column after a reorder", () => {
        renderTable(orderedGroups(), 99, true, true);

        dragRowOnto("Team Three", "Team One");

        const orderCells = Array.from(document.querySelectorAll("tbody.ant-table-tbody tr td:nth-child(2)")).map((cell) => cell.textContent);
        expect(orderCells).toEqual(["1", "2", "3"]);
        expect(rowOf("Team Three").querySelector("td:nth-child(2)")?.textContent).toBe("1");
    });

    it("does not report a reorder when a row is dropped on itself", () => {
        renderTable(orderedGroups(), 99, true, true);

        dragRowOnto("Team Two", "Team Two");

        expect(onReorder).not.toHaveBeenCalled();
        expect(renderedGroupNames()).toEqual(["Team One", "Team Two", "Team Three"]);
    });

    it("ignores a drop that was not preceded by a drag", () => {
        renderTable(orderedGroups(), 99, true, true);

        fireEvent.drop(rowOf("Team Two"));

        expect(onReorder).not.toHaveBeenCalled();
    });

    it("ignores a drop after the drag was ended", () => {
        renderTable(orderedGroups(), 99, true, true);

        fireEvent.dragStart(rowOf("Team Three"));
        fireEvent.dragEnd(rowOf("Team Three"));
        fireEvent.drop(rowOf("Team One"));

        expect(onReorder).not.toHaveBeenCalled();
        expect(renderedGroupNames()).toEqual(["Team One", "Team Two", "Team Three"]);
    });

    it("adopts the order returned by the backend after a reorder", () => {
        const {rerender} = render(<DiveGroupTable
                diveGroups={orderedGroups()}
                loading={false}
                currentUserId={99}
                canJoinDiveGroup={true}
                canReorderDiveGroups={true}
                onJoin={onJoin}
                onLeave={onLeave}
                onDelete={onDelete}
                onReorder={onReorder}/>);

        dragRowOnto("Team Three", "Team One");
        expect(renderedGroupNames()).toEqual(["Team Three", "Team One", "Team Two"]);

        rerender(<DiveGroupTable
                diveGroups={[
                    diveGroup({id: 2, name: "Team Two", groupOrder: 1, ownerId: 20, ownerName: "Owner Twenty"}),
                    diveGroup({id: 1, name: "Team One", groupOrder: 2, ownerId: 10, ownerName: "Owner Ten"}),
                    diveGroup({id: 3, name: "Team Three", groupOrder: 3, ownerId: 30, ownerName: "Owner Thirty"})
                ]}
                loading={false}
                currentUserId={99}
                canJoinDiveGroup={true}
                canReorderDiveGroups={true}
                onJoin={onJoin}
                onLeave={onLeave}
                onDelete={onDelete}
                onReorder={onReorder}/>);

        expect(renderedGroupNames()).toEqual(["Team Two", "Team One", "Team Three"]);
    });

    it("reorders even when no reorder handler is supplied", () => {
        render(<DiveGroupTable
                diveGroups={orderedGroups()}
                loading={false}
                currentUserId={99}
                canJoinDiveGroup={true}
                canReorderDiveGroups={true}
                onJoin={onJoin}
                onLeave={onLeave}
                onDelete={onDelete}/>);

        dragRowOnto("Team Three", "Team One");

        expect(renderedGroupNames()).toEqual(["Team Three", "Team One", "Team Two"]);
    });
});

describe("DiveGroupFormModal", () => {
    const onCancel = jest.fn();
    const onCreated = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    function renderModal(open: boolean, canAssignOwner: boolean, diveGroups: DiveGroupResponse[] = []) {
        return render(<DiveGroupFormModal
                open={open}
                eventId={42}
                participants={participants}
                diveGroups={diveGroups}
                canAssignOwner={canAssignOwner}
                onCancel={onCancel}
                onCreated={onCreated}/>);
    }

    it("renders nothing when closed", () => {
        renderModal(false, false);

        expect(screen.queryByText("DiveEvent.diveGroup.modal.title")).toBeNull();
    });

    it("renders a disabled owner field for a regular user", () => {
        renderModal(true, false);

        expect(screen.getByText("DiveEvent.diveGroup.modal.title")).toBeInTheDocument();
        expect(screen.getByText("DiveEvent.diveGroup.form.name.label")).toBeInTheDocument();
        expect(screen.getByText("DiveEvent.diveGroup.form.owner.label")).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeDisabled();
    });

    it("renders the owner field for organizers and administrators", () => {
        renderModal(true, true);

        expect(screen.getByText("DiveEvent.diveGroup.form.owner.label")).toBeInTheDocument();
    });

    it("only offers participants who are not already in a dive group", async () => {
        renderModal(true, true, [diveGroup()]);

        fireEvent.mouseDown(screen.getByRole("combobox"));

        await waitFor(() => expect(screen.getByText("Diver Twenty")).toBeInTheDocument());
        expect(screen.queryByText("Owner Ten")).toBeNull();
    });

    it("defaults the owner to the current user", async () => {
        mockCreateDiveGroup.mockResolvedValue(diveGroup());

        renderModal(true, true);

        fireEvent.change(screen.getByPlaceholderText("DiveEvent.diveGroup.form.name.placeholder"), {target: {value: "Team Sidemount"}});
        fireEvent.click(screen.getByText("DiveEvent.diveGroup.form.submit"));

        await waitFor(() => expect(mockCreateDiveGroup).toHaveBeenCalledWith({eventId: 42, name: "Team Sidemount", ownerId: 10}));
    });

    it("validates that the name is required", async () => {
        renderModal(true, false);

        fireEvent.click(screen.getByText("DiveEvent.diveGroup.form.submit"));

        await waitFor(() => expect(screen.getByText("DiveEvent.diveGroup.form.name.rules.required")).toBeInTheDocument());
        expect(mockCreateDiveGroup).not.toHaveBeenCalled();
    });

    it("validates the maximum length of the name", async () => {
        renderModal(true, false);

        fireEvent.change(screen.getByPlaceholderText("DiveEvent.diveGroup.form.name.placeholder"), {target: {value: "x".repeat(256)}});
        fireEvent.click(screen.getByText("DiveEvent.diveGroup.form.submit"));

        await waitFor(() => expect(screen.getByText("DiveEvent.diveGroup.form.name.rules.maxLength")).toBeInTheDocument());
        expect(mockCreateDiveGroup).not.toHaveBeenCalled();
    });

    it("creates a dive group without an owner", async () => {
        const created = diveGroup();
        mockCreateDiveGroup.mockResolvedValue(created);

        renderModal(true, false);

        fireEvent.change(screen.getByPlaceholderText("DiveEvent.diveGroup.form.name.placeholder"), {target: {value: "Team Sidemount"}});
        fireEvent.click(screen.getByText("DiveEvent.diveGroup.form.submit"));

        await waitFor(() => expect(mockCreateDiveGroup).toHaveBeenCalledWith({eventId: 42, name: "Team Sidemount"}));
        expect(onCreated).toHaveBeenCalledWith(created);
    });

    it("creates a dive group with the selected owner when allowed", async () => {
        mockCreateDiveGroup.mockResolvedValue(diveGroup());

        renderModal(true, true);

        fireEvent.change(screen.getByPlaceholderText("DiveEvent.diveGroup.form.name.placeholder"), {target: {value: "Team Sidemount"}});

        fireEvent.mouseDown(screen.getByRole("combobox"));
        await waitFor(() => expect(screen.getByText("Diver Twenty")).toBeInTheDocument());
        fireEvent.click(screen.getByText("Diver Twenty"));

        fireEvent.click(screen.getByText("DiveEvent.diveGroup.form.submit"));

        await waitFor(() => expect(mockCreateDiveGroup).toHaveBeenCalledWith({eventId: 42, name: "Team Sidemount", ownerId: 20}));
    });

    it("shows an error when the creation fails", async () => {
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        mockCreateDiveGroup.mockRejectedValue(new Error("nope"));

        renderModal(true, false);

        fireEvent.change(screen.getByPlaceholderText("DiveEvent.diveGroup.form.name.placeholder"), {target: {value: "Team Sidemount"}});
        fireEvent.click(screen.getByText("DiveEvent.diveGroup.form.submit"));

        await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("DiveEvent.diveGroup.error.create"));
        expect(onCreated).not.toHaveBeenCalled();
    });

    it("cancels through the cancel button", async () => {
        renderModal(true, false);

        await act(async () => {
            fireEvent.click(screen.getByText("common.button.cancel"));
        });

        expect(onCancel).toHaveBeenCalled();
    });
});
