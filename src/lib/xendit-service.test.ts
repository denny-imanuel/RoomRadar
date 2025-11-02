
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
        it('should call createPaymentRequest with correct parameters for eWallet', async () => {
            const mockPaymentResponse = { id: 'pr-ewallet-123', status: 'PENDING' };
            (mockPRP.createPaymentRequest as jest.Mock).mockResolvedValue(mockPaymentResponse);

            const result = await createXenditPayment(10000, 'IDR', 'ID', 'ID_OVO', 'EWALLET');

            expect(mockPRP.createPaymentRequest).toHaveBeenCalledWith({
                amount: 10000,
                currency: 'IDR',
                country: 'ID',
                paymentMethod: {
                    type: 'EWALLET',
                    reusability: 'ONE_TIME_USE',
                    channelCode: 'ID_OVO',
                },
            });
            expect(result).toEqual(mockPaymentResponse);
        });

        it('should call createPaymentRequest with correct parameters for Virtual Account', async () => {
            const mockPaymentResponse = { id: 'pr-va-123', status: 'PENDING' };
            (mockPRP.createPaymentRequest as jest.Mock).mockResolvedValue(mockPaymentResponse);

            const result = await createXenditPayment(50000, 'IDR', 'ID', 'BCA', 'VIRTUAL_ACCOUNT');

            expect(mockPRP.createPaymentRequest).toHaveBeenCalledWith({
                amount: 50000,
                currency: 'IDR',
                country: 'ID',
                paymentMethod: {
                    type: 'VIRTUAL_ACCOUNT',
                    reusability: 'ONE_TIME_USE',
                    channelCode: 'BCA',
                },
            });
            expect(result).toEqual(mockPaymentResponse);
        });

        it('should call createPaymentRequest with correct parameters for Retail Outlet (OTC)', async () => {
            const mockPaymentResponse = { id: 'pr-otc-123', status: 'PENDING' };
            (mockPRP.createPaymentRequest as jest.Mock).mockResolvedValue(mockPaymentResponse);

            const result = await createXenditPayment(75000, 'IDR', 'ID', 'ALFAMART', 'OTC');

            expect(mockPRP.createPaymentRequest).toHaveBeenCalledWith({
                amount: 75000,
                currency: 'IDR',
                country: 'ID',
                paymentMethod: {
                    type: 'OTC',
                    reusability: 'ONE_TIME_USE',
                    channelCode: 'ALFAMART',
                },
            });
            expect(result).toEqual(mockPaymentResponse);
        });

        it('should throw an error if the API call fails', async () => {
            (mockPRP.createPaymentRequest as jest.Mock).mockRejectedValue(new Error('API Error'));
            await expect(createXenditPayment(10000, 'IDR', 'ID', 'ID_OVO', 'EWALLET')).rejects.toThrow('Failed to create Xendit payment request.');
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
