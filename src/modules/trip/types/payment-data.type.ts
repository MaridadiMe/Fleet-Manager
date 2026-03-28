export interface PaymentData {
  orderReference: string;
  clientReference: string;
  status: 'OPEN' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED' | 'EXPIRED';
  transactionReference: string;
}
