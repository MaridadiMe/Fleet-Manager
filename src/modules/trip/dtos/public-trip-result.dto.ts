export interface PublicTripResultDto {
  id: string;
  startLat: number;
  startLon: number;
  startAddress?: string;
  endLat: number;
  endLon: number;
  endAddress?: string;
  departureAt: Date;
  seatsTotal: number;
  seatsAvailable: number;
  price: number;
  status: string;
}
