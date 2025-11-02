
'use server';

import { 
    createXenditPayment, 
    getXenditPaymentStatus, 
    createXenditPayout, 
    getXenditPayoutStatus 
} from './xendit-service';
import { Xendit } from 'xendit-node';

// Mock the xendit-node library
jest.mock('xendit-node', () => {
    const mockPaymentRequest = {
        createPaymentRequest: jest.fn(),
        getPaymentRequest: jest.fn(),
    };
    const mockPayout = {
        createPayout: jest.fn(),
        getPayout: jest.fn(),
    };
    return {
        Xendit: jest.fn().mockImplementation(() => ({
            PaymentRequest: mockPaymentRequest,
            Payout: mockPayout,
        })),
    };
});

// Create a typed mock of the Xendit client
const mockXenditClient = new Xendit({ secretKey: 'test' });
const mockPRP = mockXenditClient.PaymentRequest;
const mockPayoutP = mockXenditClient.Payout;


describe('Xendit Service', () => {
    
    beforeEach(() => {
        // Clear all mocks before each test
        (mockPRP.createPaymentRequest as jest.Mock).mockClear();
        (mockPRP.getPaymentRequest as jest.Mock).mockClear();
        (mockPayoutP.createPayout as jest.Mock).mockClear();
        (mockPayoutP.getPayout as jest.Mock).mockClear();
    });

    describe('createXenditPayment', () => {
        it('should call createPaymentRequest with correct parameters', async () => {
            const mockPaymentResponse = { id: 'pr-123', status: 'PENDING' };
            (mockPRP.createPaymentRequest as jest.Mock).mockResolvedValue(mockPaymentResponse);

            const amount = 10000;
            const currency = 'IDR';
            const country = 'ID';
            const channelCode = 'ID_OVO';

            const result = await createXenditPayment(amount, currency, country, channelCode);

            expect(mockPRP.createPaymentRequest).toHaveBeenCalledWith({
                amount,
                currency,
                country,
                paymentMethod: {
                    type: 'EWALLET',
                    reusability: 'ONE_TIME_USE',
                    channelCode,
                },
            });
            expect(result).toEqual(mockPaymentResponse);
        });

        it('should throw an error if the API call fails', async () => {
            (mockPRP.createPaymentRequest as jest.Mock).mockRejectedValue(new Error('API Error'));
            await expect(createXenditPayment(10000, 'IDR', 'ID', 'ID_OVO')).rejects.toThrow('Failed to create Xendit payment request.');
        });
    });

    describe('getXenditPaymentStatus', () => {
        it('should call getPaymentRequest with the correct ID', async () => {
            const mockStatusResponse = { id: 'pr-123', status: 'SUCCESSFUL' };
            (mockPRP.getPaymentRequest as jest.Mock).mockResolvedValue(mockStatusResponse);

            const id = 'pr-123';
            const result = await getXenditPaymentStatus(id);

            expect(mockPRP.getPaymentRequest).toHaveBeenCalledWith({ id });
            expect(result).toEqual(mockStatusResponse);
        });
    });

    describe('createXenditPayout', () => {
        it('should call createPayout with correct parameters', async () => {
            const mockPayoutResponse = { id: 'payout-456', status: 'ACCEPTED' };
            (mockPayoutP.createPayout as jest.Mock).mockResolvedValue(mockPayoutResponse);

            const amount = 50000;
            const channelCode = 'ID_BCA';
            const channelProperties = { account_holder_name: 'Test User', account_number: '1234567890' };

            const result = await createXenditPayout(amount, channelCode, channelProperties);

            expect(mockPayoutP.createPayout).toHaveBeenCalledWith(expect.objectContaining({
                channelCode,
                channelProperties,
                amount,
                currency: 'IDR',
            }));
            expect(result).toEqual(mockPayoutResponse);
        });
    });

    describe('getXenditPayoutStatus', () => {
        it('should call getPayout with the correct ID', async () => {
            const mockStatusResponse = { id: 'payout-456', status: 'COMPLETED' };
            (mockPayoutP.getPayout as jest.Mock).mockResolvedValue(mockStatusResponse);

            const id = 'payout-456';
            const result = await getXenditPayoutStatus(id);

            expect(mockPayoutP.getPayout).toHaveBeenCalledWith({ id });
            expect(result).toEqual(mockStatusResponse);
        });
    });
});
