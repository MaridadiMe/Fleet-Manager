import { BaseEntity } from 'src/common/entities/base.entity';
import { Vehicle } from 'src/modules/vehicle/entities/vehicle.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity({ name: 'OWNER' })
export class Owner extends BaseEntity {
  @Column({ nullable: true, unique: true })
  userId: string;

  @Column({ nullable: false, unique: true })
  nationalIdNumber: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  phone: string;

  @Column({ nullable: false })
  email: string;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.owner)
  vehicles: Vehicle[];
}
