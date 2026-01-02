import { BOOKING_STATUS } from '../enums/booking-status.enum';

export interface TripSearchResultDto {
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
  driver: {
    id: string;
    driverName: string;
  } | null;
  vehicle: {
    id: string;
    registrationNumber: string;
    type: string;
  } | null;
  bookings: {
    id: string;
    status: string;
    seats: number;
    bookedAt: Date;
  }[];
}

// interface TripSearchResultDto {
//   id: string;
//   startLat: number;
//   startLon: number;
//   startAddress?: string;
//   endLat: number;
//   endLon: number;
//   endAddress?: string;
//   departureAt: Date;
//   seatsTotal: number;
//   seatsAvailable: number;
//   price: number;
//   driver: {
//     id: string;
//     driverName: string;
//   } | null;
//   vehicle: {
//     id: string;
//     registrationNumber: string;
//     type: string;
//   } | null;

//   bookings: {
//     id: string;
//     tripId: string;
//     status: BOOKING_STATUS;
//     seats: number;
//     bookedAt: string;
//   } | [];
// }
