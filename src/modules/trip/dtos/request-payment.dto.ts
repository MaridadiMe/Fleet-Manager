export type RequestPaymentDto = {
  clientReference: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  totalAmount: string;
  currency: string;
  description: string;
  pullFromWalllet: boolean;
};
