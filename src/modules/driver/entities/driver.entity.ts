import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, OneToOne } from 'typeorm';
import { IdentificationType } from '../enums/identificationType.enum';
import { Vehicle } from 'src/modules/vehicle/entities/vehicle.entity';

@Entity({ name: 'DRIVER' })
export class Driver extends BaseEntity {
  @Column({ nullable: true, unique: true })
  userId: string;

  @Column({ nullable: false, unique: true })
  licenceNumber: string;

  @Column({ nullable: false, unique: true })
  nationalIdNumber: string;

  @OneToOne(() => Vehicle, (vehicle) => vehicle.driver)
  assignedVehicle: Vehicle;
}
