/// <reference types="jest" />
import {paymentAPI} from "../services";
import MockAdapter from "axios-mock-adapter";
import type {PaymentRequest} from "../models";
import {PaymentTypeEnum} from "../models";

describe("PaymentAPI", () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(paymentAPI["axiosInstance"]);
    });

    afterEach(() => {
        mock.reset();
    });

    it("should get all active payment status", async () => {
        const mockResponse = [{id: 1, status: "ACTIVE"}, {id: 2, status: "ACTIVE"}];
        mock.onGet("/active").reply(200, mockResponse);

        const result = await paymentAPI.getAllActivePaymentStatus();
        expect(result).toEqual(mockResponse);
    });

    it("should get all active payment status by type", async () => {
        const type = PaymentTypeEnum.PERIODICAL;
        const mockResponse = [{id: 1, status: "ACTIVE", type}];
        mock.onGet(`/active/${type}`).reply(200, mockResponse);

        const result = await paymentAPI.getAllActivePaymentStatusWithPaymentType(type);
        expect(result).toEqual(mockResponse);
    });

    it("should reset all payments", async () => {
        const type = PaymentTypeEnum.ONE_TIME;
        mock.onGet(`/reset?payment_type=${type}`).reply(200);

        const result = await paymentAPI.resetAllPayments(type);
        expect(result).toBe(true);
    });

    it("should find payment by user id", async () => {
        const userId = 1;
        const mockResponse = {id: 1, userId, status: "ACTIVE"};
        mock.onGet(`/user/${userId}`).reply(200, mockResponse);

        const result = await paymentAPI.findByUserId(userId);
        expect(result).toEqual(mockResponse);
    });

    it("should find current and future payments by user id", async () => {
        const userId = 1;
        const mockResponse = {userId, status: "OK", payments: []};
        mock.onGet(`/user/${userId}/current-and-future`).reply(200, mockResponse);

        const result = await paymentAPI.findCurrentAndFutureByUserId(userId);
        expect(result).toEqual(mockResponse);
    });

    it("should find all payments", async () => {
        const mockResponse = [{id: 1, status: "ACTIVE"}, {id: 2, status: "INACTIVE"}];
        mock.onGet("").reply(200, mockResponse);

        const result = await paymentAPI.findAll();
        expect(result).toEqual(mockResponse);
    });

    it("should create payment", async () => {
        const payload = {
            id: 0,
            user_id: 214,
            payment_type: PaymentTypeEnum.PERIODICAL,
            payment_count: 1,
            start_date: "2026-01-01",
            end_date: "2027-01-01"
        } as PaymentRequest;
        const mockResponse = {id: 1, type: PaymentTypeEnum.ONE_TIME, amount: 100};
        mock.onPost("", payload).reply(200, mockResponse);

        const result = await paymentAPI.create(payload);
        expect(result).toEqual(mockResponse);
        expect(JSON.parse(mock.history.post[0]?.data)).toEqual(payload);
        expect(mock.history.post[0]?.data).not.toContain("T00:00:00");
    });

    it("should update payment", async () => {
        const payload = {id: 1, type: PaymentTypeEnum.PERIODICAL, amount: 150} as unknown as PaymentRequest;
        const mockResponse = {id: 1, type: PaymentTypeEnum.PERIODICAL, amount: 150};
        mock.onPut("", payload).reply(200, mockResponse);

        const result = await paymentAPI.update(payload);
        expect(result).toEqual(mockResponse);
    });

    it("should delete payment", async () => {
        mock.onDelete("/1").reply(204);
        await paymentAPI.delete(1);
        expect(mock.history.delete).toHaveLength(1);
    });
});
