import {Entity} from "../../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../../src/decorator/columns/Column";
import {OneToOne} from "../../../../../../../src/decorator/relations/OneToOne";
import {Post} from "./Post";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToOne(type => Post, post => post.category2)
    post: Post;

    postId: number;

}