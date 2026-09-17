/// <reference types="jest" />
import MockAdapter from 'axios-mock-adapter';
import dayjs from 'dayjs';
import {diveGroupAPI, setGlobalTimezone} from '../services';
import type {ActionResponse, DiveGroupDetailsRequest, DiveGroupRequest, DiveGroupResponse, DiveGroupUpdateRequest} from '../models';
import {UpdateStatusEnum, UserTypeEnum} from '../models';

describe("DiveGroupAPI", () => {
    let mock: MockAdapter;

    const rawDiveGroup = {
        id: 1,
        eventId: 42,
        name: "Team Sidemount",
        ownerId: 123,
        ownerName: "John Doe",
        createdAt: "2026-05-30T12:00:00Z",
        updatedAt: null,
        members: [
            {
                userId: 123,
                name: "John Doe",
                userType: UserTypeEnum.SCUBA_DIVER,
                owner: true,
                joinedAt: "2026-05-30T12:00:00Z"
            }
        ]
    };

    const okActionResponse: ActionResponse = {
        status: UpdateStatusEnum.OK,
        message: "Dive group removed"
    };

    beforeAll(() => {
        setGlobalTimezone("Europe/Helsinki");
    });

    beforeEach(() => {
        mock = new MockAdapter(diveGroupAPI["axiosInstance"]);
    });

    afterEach(() => {
        mock.reset();
    });

    it("should get dive groups by event id", async () => {
        mock.onGet("/events/42").reply(200, [rawDiveGroup]);

        const result = await diveGroupAPI.getDiveGroupsByEventId(42);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
        expect(result[0].name).toBe("Team Sidemount");
        expect(dayjs.isDayjs(result[0].createdAt)).toBe(true);
        expect(dayjs.isDayjs(result[0].members[0].joinedAt)).toBe(true);
        expect(mock.history.get[0].url).toBe("/events/42");
    });

    it("should return an empty list when the event has no dive groups", async () => {
        mock.onGet("/events/7").reply(200, []);

        const result = await diveGroupAPI.getDiveGroupsByEventId(7);

        expect(result).toEqual([]);
    });

    it("should get a dive group by id", async () => {
        mock.onGet("/1").reply(200, rawDiveGroup);

        const result = await diveGroupAPI.getDiveGroupById(1);

        expect(result.id).toBe(1);
        expect(result.ownerId).toBe(123);
        expect(dayjs.isDayjs(result.createdAt)).toBe(true);
        expect(mock.history.get[0].url).toBe("/1");
    });

    it("should create a dive group", async () => {
        const payload: DiveGroupRequest = {eventId: 42, name: "Team Sidemount", ownerId: 123};
        mock.onPost("").reply(200, rawDiveGroup);

        const result = await diveGroupAPI.createDiveGroup(payload);

        expect(result.id).toBe(1);
        expect(mock.history.post).toHaveLength(1);
        expect(JSON.parse(mock.history.post[0].data)).toEqual(payload);
    });

    it("should create a dive group without an explicit owner", async () => {
        const payload: DiveGroupRequest = {eventId: 42, name: "Team Sidemount"};
        mock.onPost("").reply(200, rawDiveGroup);

        const result = await diveGroupAPI.createDiveGroup(payload);

        expect(result.eventId).toBe(42);
        expect(JSON.parse(mock.history.post[0].data)).toEqual({eventId: 42, name: "Team Sidemount"});
    });

    it("should update a dive group", async () => {
        const payload: DiveGroupUpdateRequest = {name: "Team Rebreather", ownerId: 456};
        const updatedDiveGroup = {...rawDiveGroup, name: "Team Rebreather", ownerId: 456, updatedAt: "2026-06-01T12:00:00Z"};
        mock.onPut("/1").reply(200, updatedDiveGroup);

        const result: DiveGroupResponse = await diveGroupAPI.updateDiveGroup(1, payload);

        expect(result.name).toBe("Team Rebreather");
        expect(result.ownerId).toBe(456);
        expect(dayjs.isDayjs(result.updatedAt)).toBe(true);
        expect(mock.history.put[0].url).toBe("/1");
        expect(JSON.parse(mock.history.put[0].data)).toEqual(payload);
    });

    it('should send the description when creating a dive group', async () => {
        const payload: DiveGroupRequest = {eventId: 42, name: 'Team Sidemount', description: 'Wreck first'};
        mock.onPost('').reply(200, {...rawDiveGroup, description: 'Wreck first'});

        const result = await diveGroupAPI.createDiveGroup(payload);

        expect(result.description).toBe('Wreck first');
        expect(JSON.parse(mock.history.post[0].data)).toEqual(payload);
    });

    it('should update the details of a dive group', async () => {
        const payload: DiveGroupDetailsRequest = {name: 'Team Rebreather', description: 'New plan'};
        const updatedDiveGroup = {...rawDiveGroup, name: 'Team Rebreather', description: 'New plan', updatedAt: '2026-06-01T12:00:00Z'};
        mock.onPut('/1/details').reply(200, updatedDiveGroup);

        const result = await diveGroupAPI.updateDiveGroupDetails(1, payload);

        expect(result.name).toBe('Team Rebreather');
        expect(result.description).toBe('New plan');
        expect(dayjs.isDayjs(result.updatedAt)).toBe(true);
        expect(mock.history.put[0].url).toBe('/1/details');
        expect(JSON.parse(mock.history.put[0].data)).toEqual(payload);
    });

    it('should send a null description unchanged when clearing the details', async () => {
        const payload: DiveGroupDetailsRequest = {name: 'Team Rebreather', description: null};
        mock.onPut('/1/details').reply(200, {...rawDiveGroup, description: null});

        const result = await diveGroupAPI.updateDiveGroupDetails(1, payload);

        expect(result.description).toBeNull();
        expect(JSON.parse(mock.history.put[0].data)).toEqual({name: 'Team Rebreather', description: null});
    });

    it('should propagate errors when the caller is not a member of the dive group', async () => {
        mock.onPut('/1/details').reply(401);

        await expect(diveGroupAPI.updateDiveGroupDetails(1, {name: 'Hijacked'})).rejects.toThrow();
    });

    it('should propagate errors when the details are rejected', async () => {
        mock.onPut('/1/details').reply(400, {status: UpdateStatusEnum.FAIL, message: 'Description too long'});

        await expect(diveGroupAPI.updateDiveGroupDetails(1, {name: 'Team', description: 'x'.repeat(9000)})).rejects.toThrow();
    });

    it('should propagate errors when the dive group to update does not exist', async () => {
        mock.onPut('/999/details').reply(404);

        await expect(diveGroupAPI.updateDiveGroupDetails(999, {name: 'Missing'})).rejects.toThrow();
    });

    it('should delete a dive group', async () => {
        mock.onDelete('/1').reply(200, okActionResponse);

        const result = await diveGroupAPI.deleteDiveGroup(1);

        expect(result).toEqual(okActionResponse);
        expect(mock.history.delete[0].url).toBe("/1");
    });

    it("should join a dive group", async () => {
        mock.onPost("/1/members").reply(200, rawDiveGroup);

        const result = await diveGroupAPI.joinDiveGroup(1);

        expect(result.id).toBe(1);
        expect(result.members).toHaveLength(1);
        expect(mock.history.post[0].url).toBe("/1/members");
    });

    it("should leave a dive group", async () => {
        mock.onDelete("/1/members").reply(200, okActionResponse);

        const result = await diveGroupAPI.leaveDiveGroup(1);

        expect(result.status).toBe(UpdateStatusEnum.OK);
        expect(mock.history.delete[0].url).toBe("/1/members");
    });

    it("should add a member to a dive group", async () => {
        mock.onPost("/1/members/456").reply(200, rawDiveGroup);

        const result = await diveGroupAPI.addMemberToDiveGroup(1, 456);

        expect(result.id).toBe(1);
        expect(mock.history.post[0].url).toBe("/1/members/456");
    });

    it("should remove a member from a dive group", async () => {
        mock.onDelete("/1/members/456").reply(200, okActionResponse);

        const result = await diveGroupAPI.removeMemberFromDiveGroup(1, 456);

        expect(result).toEqual(okActionResponse);
        expect(mock.history.delete[0].url).toBe("/1/members/456");
    });

    it("should not mutate the original response payload when transforming dates", async () => {
        mock.onGet("/1").reply(200, rawDiveGroup);

        await diveGroupAPI.getDiveGroupById(1);

        expect(rawDiveGroup.createdAt).toBe("2026-05-30T12:00:00Z");
        expect(rawDiveGroup.members[0].joinedAt).toBe("2026-05-30T12:00:00Z");
    });

    it("should propagate errors from failing requests", async () => {
        mock.onGet("/999").reply(404);

        await expect(diveGroupAPI.getDiveGroupById(999)).rejects.toThrow();
    });

    it("should propagate errors when a dive group cannot be deleted", async () => {
        mock.onDelete("/999").reply(400, {status: UpdateStatusEnum.FAIL, message: "Dive event can no longer be modified"});

        await expect(diveGroupAPI.deleteDiveGroup(999)).rejects.toThrow();
    });

    it("should set the order of the dive groups of an event", async () => {
        const reordered = [
            {...rawDiveGroup, id: 2, groupOrder: 1},
            {...rawDiveGroup, id: 1, groupOrder: 2}
        ];
        mock.onPut("/events/42/order").reply(200, reordered);

        const result = await diveGroupAPI.reorderDiveGroups(42, [2, 1]);

        expect(result.map((diveGroup) => diveGroup.id)).toEqual([2, 1]);
        expect(result.map((diveGroup) => diveGroup.groupOrder)).toEqual([1, 2]);
        expect(dayjs.isDayjs(result[0].createdAt)).toBe(true);
        expect(mock.history.put[0].url).toBe("/events/42/order");
        expect(JSON.parse(mock.history.put[0].data)).toEqual({diveGroupIds: [2, 1]});
    });

    it("should send an empty order list unchanged", async () => {
        mock.onPut("/events/7/order").reply(200, []);

        const result = await diveGroupAPI.reorderDiveGroups(7, []);

        expect(result).toEqual([]);
        expect(JSON.parse(mock.history.put[0].data)).toEqual({diveGroupIds: []});
    });

    it("should propagate errors when the dive group order is rejected", async () => {
        mock.onPut("/events/42/order").reply(400, {status: UpdateStatusEnum.FAIL, message: "Invalid order"});

        await expect(diveGroupAPI.reorderDiveGroups(42, [1])).rejects.toThrow();
    });

    it("should propagate errors when the caller may not set the dive group order", async () => {
        mock.onPut("/events/42/order").reply(403);

        await expect(diveGroupAPI.reorderDiveGroups(42, [1, 2])).rejects.toThrow();
    });
});
