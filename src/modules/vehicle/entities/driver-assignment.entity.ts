import { BaseEntity } from 'src/common/entities/base.entity';
import { Driver } from 'src/modules/driver/entities/driver.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Entity({ name: 'DRIVER_ASSIGNMENT' })
export class DriverAssignment extends BaseEntity {
  @ManyToOne(() => Driver)
  @JoinColumn()
  driver: Driver;

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
