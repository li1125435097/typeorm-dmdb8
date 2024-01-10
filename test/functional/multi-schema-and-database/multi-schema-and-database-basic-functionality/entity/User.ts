import {Entity} from "../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../src/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";

@Entity({ schema: "userSchema" })
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}