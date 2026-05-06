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

export interface FullTripResultDto {
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
  createdAt: Date;
  createdBy: string;
  driver: {
    id: string;
    name: string;
    phone: string;
    email: string;
    licenceNumber: string;
    nin: string;
    createdBy: string;
    createdAt: Date;
  } | null;
  vehicle: {
    id: string;
    registrationNumber: string;
    type: string;
    createdAt: Date;
    createdBy: string;
  } | null;
  bookings: {
    id: string;
    status: string;
    seats: number;
    bookedAt: Date;
    riderName: string;
    riderPhone: string;
    riderEmail: string;
  }[];
}
