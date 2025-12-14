import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, OneToMany, OneToOne } from 'typeorm';
import { Vehicle } from 'src/modules/vehicle/entities/vehicle.entity';
import { Trip } from 'src/modules/trip/entities/trip.entity';

@Entity({ name: 'DRIVERS' })
export class Driver extends BaseEntity {
  @Column({ nullable: true, unique: true })
  userId: string;

  @Column({ nullable: false, unique: true })
  licenceNumber: string;

  @Column({ nullable: false, unique: true })
  nationalIdNumber: string;

  @Column({ nullable: false })
  driverName: string;

  @Column({ nullable: false })
  phone: string;

  @Column({ nullable: false })
  email: string;

  @OneToOne(() => Vehicle, (vehicle) => vehicle.driver)
  assignedVehicle: Vehicle;

  @OneToMany(() => Trip, (trip) => trip.driver)
  trips: Trip[];
}
