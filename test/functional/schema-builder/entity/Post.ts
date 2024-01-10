import {Entity} from "../../../../src/decorator/entity/Entity";
import {Column} from "../../../../src/decorator/columns/Column";
import {Unique} from "../../../../src/decorator/Unique";
import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";
import {Check} from "../../../../src/decorator/Check";
import {Exclusion} from "../../../../src/decorator/Exclusion";

@Entity()
@Unique(["text", "tag"])
@Exclusion(`USING gist ("text" WITH =)`)
@Check(`"likesCount" < 1000`)
export class Post {

    @PrimaryColumn()
    id: number;

    @Column({ unique: true })
    version: string;

    @Column({ default: "My post" })
    name: string;

    @Column({ nullable: true })
    text: string;

    @Column()
    tag: string;

    @Column()
    likesCount: number;

}
