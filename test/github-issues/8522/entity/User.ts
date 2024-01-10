import { TableInheritance, Column, Entity } from "../../../../src";
import { BaseEntity } from "./BaseEntity";

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class User extends BaseEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;
  
}