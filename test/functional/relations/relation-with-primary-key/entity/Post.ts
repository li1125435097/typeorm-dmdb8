import {Entity} from "../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../src/decorator/columns/Column";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {Category} from "./Category";

@Entity()
export class Post {

    @ManyToOne(type => Category, category => category.posts, {
        primary: true,
        cascade: ["insert"]
    })
    category: Category;

    @Column()
    title: string;

}