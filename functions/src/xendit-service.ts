
import "dotenv/config";
import { Xendit } from "xendit-node";
import { v4 as uuidv4 } from "uuid";

const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY || "",
});

const { PaymentRequest: PRP, Payout: PayoutP } = xenditClient;

export type PaymentMethodType = "VIRTUAL_ACCOUNT" | "EWALLET" | "OTC";

export async function createXenditPayment(
    amount: number,
    currency: string,
    country: string,
    channelCode: string,
    paymentMethodType: PaymentMethodType
): Promise<any> { // Return any to avoid library type issues
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

    const payment = await PRP.createPaymentRequest(paymentRequestParams as any);
    return payment;
  } catch (error: any) {
    console.error("Error creating Xendit payment request:", error.message);
    throw new Error("Failed to create Xendit payment request.");
  }
}

export async function getXenditPaymentStatus(id: string): Promise<any> {
  try {
    const payment = await PRP.getPaymentRequestByID({ paymentRequestId: id });
    return payment;
  } catch (error: any) {
    console.error("Error getting Xendit payment request status:", error.message);
    throw new Error("Failed to get Xendit payment request status.");
  }
}

export async function createXenditPayout(
    amount: number,
    channelCode: string,
    channelProperties: { [key: string]: any }
): Promise<any> {
  try {
    const payoutParams = {
      referenceId: `payout-${uuidv4()}`,
      channelCode,
      channelProperties,
      amount,
      currency: "IDR",
      description: "Withdrawal from RoomRadar Wallet",
    };

    const payout = await PayoutP.createPayout(payoutParams as any);
    return payout;
  } catch (error: any) {
    console.error("Error creating Xendit payout:", error.message);
    throw new Error("Failed to create Xendit payout.");
  }
}

export async function getXenditPayoutStatus(id: string): Promise<any> {
  try {
    const payout = await PayoutP.getPayoutById({ id });
    return payout;
  } catch (error: any) {
    console.error("Error getting Xendit payout status:", error.message);
    throw new Error("Failed to get Xendit payout status.");
  }
}
