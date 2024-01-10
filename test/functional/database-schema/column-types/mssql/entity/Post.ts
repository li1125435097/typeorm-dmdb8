import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";
import {FruitEnum} from "../enum/FruitEnum";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    // -------------------------------------------------------------------------
    // Numeric Types
    // -------------------------------------------------------------------------

    @Column("bit")
    bit: boolean;

    @Column("tinyint")
    tinyint: number;

    @Column("smallint")
    smallint: number;

    @Column("int")
    int: number;

    @Column("bigint")
    bigint: string;

    @Column("decimal")
    decimal: number;

    @Column("dec")
    dec: number;

    @Column("numeric")
    numeric: number;

    @Column("float")
    float: number;

    @Column("real")
    real: number;

    @Column("smallmoney")
    smallmoney: number;

    @Column("money")
    money: number;

    // -------------------------------------------------------------------------
    // Character Types
    // -------------------------------------------------------------------------

    @Column("uniqueidentifier")
    uniqueidentifier: string;

    @Column("char")
    char: string;

    @Column("varchar")
    varchar: string;

    @Column("text")
    text: string;

    @Column("nchar")
    nchar: string;

    @Column("nvarchar")
    nvarchar: string;

    @Column("ntext")
    ntext: string;

    @Column("binary")
    binary: Buffer;

    @Column("varbinary")
    varbinary: Buffer;

    @Column("image")
    image: Buffer;

    @Column("rowversion")
    rowversion: Buffer;

    // -------------------------------------------------------------------------
    // Date Types
    // -------------------------------------------------------------------------

    @Column("date")
    dateObj: Date;

    @Column("date")
    date: string;

    @Column("datetime")
    datetime: Date;

    @Column("datetime2")
    datetime2: Date;

    @Column("smalldatetime")
    smalldatetime: Date;

    @Column("time")
    timeObj: Date;

    @Column("time")
    time: string;

    @Column("datetimeoffset")
    datetimeoffset: Date;

    // -------------------------------------------------------------------------
    // Spatial Types
    // -------------------------------------------------------------------------

    @Column("geometry")
    geometry1: string;

    @Column("geometry")
    geometry2: string;

    @Column("geometry")
    geometry3: string;

    // -------------------------------------------------------------------------
    // TypeOrm Specific Types
    // -------------------------------------------------------------------------

    @Column("simple-array")
    simpleArray: string[];

    @Column("simple-json")
    simpleJson: { param: string };

    @Column("simple-enum", { enum: ["A", "B", "C"] })
    simpleEnum: string;

    @Column("simple-enum", { enum: FruitEnum })
    simpleClassEnum1: FruitEnum;
}
