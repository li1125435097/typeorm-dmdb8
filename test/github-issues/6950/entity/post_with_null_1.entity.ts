import {BaseEntity, Column, Entity, PrimaryGeneratedColumn} from "../../../../src";

@Entity("post_test")
export class Post extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({
        default: "This is default text."
    })
    text: string;

    @Column({
        default: null,
    })
    comments: string;

}
