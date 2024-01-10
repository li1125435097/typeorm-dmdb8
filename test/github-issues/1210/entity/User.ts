import {Entity} from "../../../../src/decorator/entity/Entity";
import {ObjectIdColumn} from "../../../../src/decorator/columns/ObjectIdColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {ObjectID} from "../../../../src/driver/mongodb/typings";
import {Event} from "./Event";

@Entity()
export class User {

    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    age: number;

    @Column(type => Event)
    events: Event[];

}