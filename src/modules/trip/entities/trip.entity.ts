import { BaseEntity } from 'src/common/entities/base.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { TRIP_STATUS } from '../enums/trip-status.enum';
import { Driver } from 'src/modules/driver/entities/driver.entity';
import { Booking } from './booking.entity';

@Entity({ name: 'TRIPS' })
export class Trip extends BaseEntity {
  @ManyToOne(() => Driver, (driver) => driver.trips)
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  @Index('DRIVER_ID')
  @Column()
  driverId: string;

  @Column({ type: 'double' })
  startLat: number;

  @Column({ type: 'double' })
  startLon: number;

  @Column({ nullable: true })
  startAddress?: string;

  @Column({ type: 'double' })
  endLat: number;

  @Column({ type: 'double' })
  endLon: number;

  @Column({ nullable: true })
  endAddress?: string;

  @Index('DEPARTURE_AT')
  @Column({ type: 'datetime' })
  departureAt: Date;

  @Column({ type: 'int' })
  seatsTotal: number;

  @Column({ type: 'int' })
  seatsAvailable: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Index('TRIP_STATUS')
  @Column({
    type: 'enum',
    enum: TRIP_STATUS,
    default: TRIP_STATUS.SCHEDULED,
  })
  status: string;

  @OneToMany(() => Booking, (booking) => booking.trip)
  bookings?: Booking[];
}
