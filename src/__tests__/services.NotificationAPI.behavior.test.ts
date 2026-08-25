import MockAdapter from "axios-mock-adapter";
import {notificationAPI} from "../services";
import type {MarkReadRequest, MessageRequest, MessageResponse} from "../models";

describe("NotificationAPI", () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(notificationAPI["axiosInstance"]);
    });

    afterEach(() => mock.restore());

    it("gets unread and all notifications without browser caching", async () => {
        const unread = [{id: 1, title: "Unread"}] as MessageResponse[];
        const all = [{id: 1, title: "Unread"}, {id: 2, title: "Read"}] as MessageResponse[];
        mock.onGet("/unread").reply(200, unread);
        mock.onGet("/all").reply(200, all);

        await expect(notificationAPI.getUnreadNotifications()).resolves.toEqual(unread);
        await expect(notificationAPI.getAllNotifications()).resolves.toEqual(all);
        expect(mock.history.get).toHaveLength(2);
        for (const request of mock.history.get) {
            expect(request.headers?.["Cache-Control"]).toBe("no-cache, no-store, must-revalidate");
            expect(request.headers?.Pragma).toBe("no-cache");
            expect(request.params?._t).toEqual(expect.any(Number));
        }
    });

    it("marks notifications read and creates single notifications", async () => {
        const markRead = {ids: [1, 2]} as unknown as MarkReadRequest;
        const message = {id: 0, title: "Reminder", message: "Hello", creator: 7} as MessageRequest;
        mock.onPost("/mark-read").reply(200, {status: "OK"});
        mock.onPost("/create").reply(200, {...message, id: 9});

        await expect(notificationAPI.markNotificationsAsRead(markRead)).resolves.toEqual({status: "OK"});
        await expect(notificationAPI.createNotification(message)).resolves.toMatchObject({id: 9});
        expect(JSON.parse(mock.history.post[0].data)).toEqual(markRead);
        expect(JSON.parse(mock.history.post[1].data)).toEqual(message);
    });

    it("propagates API failures for read and create operations", async () => {
        const request = {ids: [999]} as unknown as MarkReadRequest;
        mock.onPost("/mark-read").networkError();
        mock.onPost("/create").reply(500);
        await expect(notificationAPI.markNotificationsAsRead(request)).rejects.toThrow();
        await expect(notificationAPI.createNotification({} as MessageRequest)).rejects.toThrow();
    });
});
