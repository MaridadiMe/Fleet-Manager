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

  @Column({ nullable: true })
  riderPhone?: string;

  @Column({ type: 'int', default: 1 })
  seats: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  bookingAmount?: number;

  @Column({ nullable: true })
  orderReference?: string;

  @Column({ nullable: true })
  transactionReference?: string;

  @Column({
    type: 'enum',
    enum: BOOKING_STATUS,
    default: BOOKING_STATUS.RESERVED,
  })
  status: string;

  @Column({ nullable: true })
  canceledAt?: Date;

  @Column({ nullable: true })
  confirmedAt?: Date;
}
