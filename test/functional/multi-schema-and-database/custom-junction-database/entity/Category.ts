import {Entity} from "../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../src/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";

@Entity({
    database: "yoman"
})
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}