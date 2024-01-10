import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";
import {Category} from "./Category";
import {ManyToOne} from "../../../../../../src/decorator/relations/ManyToOne";
import {BaseEntity} from "../../../../../../src";

@Entity()
export class Post extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToOne(() => Category, category => category.posts, {
        cascade: ["insert"]
    })
    category: Promise<Category>;
}
