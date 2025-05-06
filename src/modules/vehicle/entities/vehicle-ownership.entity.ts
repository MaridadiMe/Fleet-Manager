import { BaseEntity } from 'src/common/entities/base.entity';
import { Driver } from 'src/modules/driver/entities/driver.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { Owner } from 'src/modules/owner/entities/owner.entity';

@Entity({ name: 'VEHICLE_OWNERSHIP' })
export class VehicleOwnership extends BaseEntity {
  @ManyToOne(() => Owner)
  @JoinColumn()
  owner: Owner;

  @ManyToOne(() => Vehicle)
  @JoinColumn()
  vehicle: Vehicle;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  unassignedAt: Date;

  @Column({ nullable: true })
  reason: string;
}
