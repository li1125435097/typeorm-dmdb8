import {Entity} from "../../../../src/decorator/entity/Entity";
import {Column} from "../../../../src/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    identifier: number;

    @Column("simple-array")
    names: string[];

}