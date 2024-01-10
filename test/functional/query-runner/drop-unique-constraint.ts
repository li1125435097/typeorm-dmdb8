import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";

describe("query runner > drop unique constraint", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mssql", "postgres", "sqlite", "better-sqlite3", "oracle", "cockroachdb"], // mysql and sap does not supports unique constraints
            schemaCreate: true,
            dropSchema: true,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly drop unique constraint and revert drop", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();

        let table = await queryRunner.getTable("post");
        table!.uniques.length.should.be.equal(2);

        // find composite unique constraint to delete
        const unique = table!.uniques.find(u => u.columnNames.length === 2);
        await queryRunner.dropUniqueConstraint(table!, unique!);

        table = await queryRunner.getTable("post");
        table!.uniques.length.should.be.equal(1);

        await queryRunner.executeMemoryDownSql();

        table = await queryRunner.getTable("post");
        table!.uniques.length.should.be.equal(2);

        await queryRunner.release();
    })));

});
