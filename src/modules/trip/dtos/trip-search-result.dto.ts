interface TripSearchResultDto {
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
  driver: {
    id: string;
    driverName: string;
  } | null;
  vehicle: {
    id: string;
    registrationNumber: string;
    type: string;
  } | null;
}
