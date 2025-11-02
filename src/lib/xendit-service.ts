
'use server';

import { Xendit } from 'xendit-node';
import type { 
    CreatePaymentRequest, 
    PaymentRequest,
    CreatePayoutRequest,
    Payout
} from 'xendit-node';
import { v4 as uuidv4 } from 'uuid';

// Make sure to set XENDIT_SECRET_KEY in your .env file
const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY || '',
});

const { PaymentRequest: PRP, Payout: PayoutP } = xenditClient;

/**
 * Creates a Xendit Payment Request for top-ups.
 * @param amount - The amount to be paid.
 * @param currency - The currency of the payment (e.g., 'IDR', 'PHP').
 * @param country - The country code (e.g., 'ID', 'PH').
 * @param channelCode - The payment channel code from Xendit docs.
 * @returns The created payment request object from Xendit.
 */
export async function createXenditPayment(
    amount: number,
    currency: string,
    country: string,
    channelCode: string
): Promise<PaymentRequest> {
    try {
        const paymentRequestParams: CreatePaymentRequest = {
            amount,
            currency,
            country,
            paymentMethod: {
                type: 'EWALLET', // or 'VIRTUAL_ACCOUNT', 'OTC' etc. depending on channel
                reusability: 'ONE_TIME_USE',
                channelCode,
            },
        };

        const payment = await PRP.createPaymentRequest(paymentRequestParams);
        console.log('Xendit Payment Request created:', payment);
        return payment;

    } catch (error) {
        console.error('Error creating Xendit payment request:', error);
        throw new Error('Failed to create Xendit payment request.');
    }
}

/**
 * Retrieves the status of a Xendit Payment Request.
 * @param id - The ID of the payment request to check.
 * @returns The payment request object with its current status.
 */
export async function getXenditPaymentStatus(id: string): Promise<PaymentRequest> {
    try {
        const payment = await PRP.getPaymentRequest({ id });
        console.log('Xendit Payment Request status:', payment);
        return payment;
    } catch (error) {
        console.error('Error getting Xendit payment request status:', error);
        throw new Error('Failed to get Xendit payment request status.');
    }
}


/**
 * Creates a Xendit Payout (disbursement).
 * @param amount - The amount to be disbursed.
 * @param channelCode - The bank or e-wallet channel code.
 * @param channelProperties - Account details (e.g., account_holder_name, account_number).
 * @returns The created payout object from Xendit.
 */
export async function createXenditPayout(
    amount: number,
    channelCode: string,
    channelProperties: { [key: string]: any }
): Promise<Payout> {
    try {
        const payoutParams: CreatePayoutRequest = {
            referenceId: `payout-${uuidv4()}`,
            channelCode,
            channelProperties,
            amount,
            currency: 'IDR', // Assuming Indonesian Rupiah for payouts
            description: 'Withdrawal from RoomRadar Wallet',
        };

        const payout = await PayoutP.createPayout(payoutParams);
        console.log('Xendit Payout created:', payout);
        return payout;

    } catch (error) {
        console.error('Error creating Xendit payout:', error);
        throw new Error('Failed to create Xendit payout.');
    }
}

/**
 * Retrieves the status of a Xendit Payout.
 * @param id - The ID of the payout to check.
 * @returns The payout object with its current status.
 */
export async function getXenditPayoutStatus(id: string): Promise<Payout> {
    try {
        const payout = await PayoutP.getPayout({ id });
        console.log('Xendit Payout status:', payout);
        return payout;
    } catch (error) {
        console.error('Error getting Xendit payout status:', error);
        throw new Error('Failed to get Xendit payout status.');
    }
}
