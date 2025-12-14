import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/modules/auth/types/user.type';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Trip } from './trip.entity';
import { BOOKING_STATUS } from '../enums/booking-status.enum';

@Entity({ name: 'BOOKINGS' })
export class Booking extends BaseEntity {
  @ManyToOne(() => Trip, (trip) => trip.bookings)
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @Column()
  tripId: string;

  @Column()
  riderId: string;

  @Column({ type: 'int', default: 1 })
  seats: number;

  @Column({
    type: 'enum',
    enum: BOOKING_STATUS,
    default: BOOKING_STATUS.CONFIRMED,
  })
  status: string;
}
