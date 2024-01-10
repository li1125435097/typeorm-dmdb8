import "reflect-metadata";
import {Connection} from "../../../src";
import {CockroachDriver} from "../../../src/driver/cockroachdb/CockroachDriver";
import {ColumnMetadataArgs} from "../../../src/metadata-args/ColumnMetadataArgs";
import {ColumnMetadata} from "../../../src/metadata/ColumnMetadata";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {Post} from "./entity/Post";

describe("schema builder > add column", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    after(() => closeTestingConnections(connections));

    it("should correctly add column", () => Promise.all(connections.map(async connection => {

        const postMetadata = connection.getMetadata("post");

        const columnMetadata1 = new ColumnMetadata({
            connection: connection,
            entityMetadata: postMetadata!,
            args: <ColumnMetadataArgs>{
                target: Post,
                propertyName: "secondId",
                mode: "regular",
                options: {
                    type: "int",
                    name: "secondId",
                    primary: !(connection.driver instanceof CockroachDriver), // CockroachDB does not allow changing pk
                    nullable: false
                }
            }
        });
        columnMetadata1.build(connection);

        const columnMetadata2 = new ColumnMetadata({
            connection: connection,
            entityMetadata: postMetadata!,
            args: <ColumnMetadataArgs>{
                target: Post,
                propertyName: "description",
                mode: "regular",
                options: {
                    type: "varchar",
                    name: "description",
                    length: 100
                }
            }
        });
        columnMetadata2.build(connection);

        postMetadata.columns.push(...[columnMetadata1, columnMetadata2]);

        await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("post");
        const column1 = table!.findColumnByName("secondId")!;
        column1.should.be.exist;
        column1.isNullable.should.be.false;
        if (!(connection.driver instanceof CockroachDriver))
            column1.isPrimary.should.be.true;

        const column2 = table!.findColumnByName("description")!;
        column2.should.be.exist;
        column2.length.should.be.equal("100");

        await queryRunner.release();
    })));

});
