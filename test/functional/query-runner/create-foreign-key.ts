import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {CockroachDriver} from "../../../src/driver/cockroachdb/CockroachDriver";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Table} from "../../../src/schema-builder/table/Table";
import {TableForeignKey} from "../../../src/schema-builder/table/TableForeignKey";

describe("query runner > create foreign key", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly create foreign key and revert creation", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();
        await queryRunner.createTable(new Table({
            name: "question",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true
                },
                {
                    name: "name",
                    type: "varchar",
                }
            ]
        }), true);

        await queryRunner.createTable(new Table({
            name: "answer",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true
                },
                {
                    name: "name",
                    type: "varchar",
                },
                {
                    name: "questionId",
                    isUnique: connection.driver instanceof CockroachDriver, // CockroachDB requires UNIQUE constraints on referenced columns
                    type: "int",
                }
            ]
        }), true);

        // clear sqls in memory to avoid removing tables when down queries executed.
        queryRunner.clearSqlMemory();

        const foreignKey = new TableForeignKey({
            columnNames: ["questionId"],
            referencedColumnNames: ["id"],
            referencedTableName: "question",
            onDelete: "CASCADE"
        });
        await queryRunner.createForeignKey("answer", foreignKey);

        let table = await queryRunner.getTable("answer");
        table!.foreignKeys.length.should.be.equal(1);
        await queryRunner.executeMemoryDownSql();

        table = await queryRunner.getTable("answer");
        table!.foreignKeys.length.should.be.equal(0);

        await queryRunner.release();
    })));

});
