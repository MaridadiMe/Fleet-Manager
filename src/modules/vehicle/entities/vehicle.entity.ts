import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { VehicleType } from '../enums/vehicle-type.enum';
import { VehicleStatus } from '../enums/vehicle-status.enum';
import { CapacityUnit } from '../enums/capacity-unit.enum';
import { Driver } from 'src/modules/driver/entities/driver.entity';
import { Owner } from 'src/modules/owner/entities/owner.entity';

@Entity({ name: 'VEHICLE' })
export class Vehicle extends BaseEntity {
  @Column({ unique: true })
  registrationNumber: string;

  @Column({
    type: 'enum',
    enum: VehicleType,
  })
  type: VehicleType;

  @Column({
    type: 'enum',
    enum: VehicleStatus,
  })
  status: VehicleStatus;

  @Column({ nullable: true })
  location: string;

  @OneToOne(() => Driver, (driver) => driver.assignedVehicle)
  @JoinColumn()
  driver: Driver;

  @Column()
  capacity: number;

  @Column({
    type: 'enum',
    enum: CapacityUnit,
  })
  capacityUnit: CapacityUnit;

  @Column({ nullable: true })
  route: string;

  @ManyToOne(() => Owner, (owner) => owner.vehicles)
  @JoinColumn()
  owner: Owner;
}
