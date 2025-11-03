"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createXenditPayment = createXenditPayment;
exports.getXenditPaymentStatus = getXenditPaymentStatus;
exports.createXenditPayout = createXenditPayout;
exports.getXenditPayoutStatus = getXenditPayoutStatus;
require("dotenv/config");
const xendit_node_1 = require("xendit-node");
const uuid_1 = require("uuid");
const xenditClient = new xendit_node_1.Xendit({
    secretKey: process.env.XENDIT_SECRET_KEY || "",
});
const { PaymentRequest: PRP, Payout: PayoutP } = xenditClient;
async function createXenditPayment(amount, currency, country, channelCode, paymentMethodType) {
    try {
        const paymentRequestParams = {
            amount,
            currency,
            country,
            paymentMethod: {
                type: paymentMethodType,
                reusability: "ONE_TIME_USE",
                channelCode,
            },
        };
        const payment = await PRP.createPaymentRequest(paymentRequestParams);
        return payment;
    }
    catch (error) {
        console.error("Error creating Xendit payment request:", error.message);
        throw new Error("Failed to create Xendit payment request.");
    }
}
async function getXenditPaymentStatus(id) {
    try {
        const payment = await PRP.getPaymentRequestByID({ paymentRequestId: id });
        return payment;
    }
    catch (error) {
        console.error("Error getting Xendit payment request status:", error.message);
        throw new Error("Failed to get Xendit payment request status.");
    }
}
async function createXenditPayout(amount, channelCode, channelProperties) {
    try {
        const payoutParams = {
            referenceId: `payout-${(0, uuid_1.v4)()}`,
            channelCode,
            channelProperties,
            amount,
            currency: "IDR",
            description: "Withdrawal from RoomRadar Wallet",
        };
        const payout = await PayoutP.createPayout(payoutParams);
        return payout;
    }
    catch (error) {
        console.error("Error creating Xendit payout:", error.message);
        throw new Error("Failed to create Xendit payout.");
    }
}
async function getXenditPayoutStatus(id) {
    try {
        const payout = await PayoutP.getPayoutById({ id });
        return payout;
    }
    catch (error) {
        console.error("Error getting Xendit payout status:", error.message);
        throw new Error("Failed to get Xendit payout status.");
    }
}
//# sourceMappingURL=xendit-service.js.map