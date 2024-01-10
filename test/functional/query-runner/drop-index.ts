import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {CockroachDriver} from "../../../src/driver/cockroachdb/CockroachDriver";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";

describe("query runner > drop index", () => {

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

    it("should correctly drop index and revert drop", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();

        let table = await queryRunner.getTable("student");
        // CockroachDB also stores indices for relation columns
        if (connection.driver instanceof CockroachDriver) {
            table!.indices.length.should.be.equal(3);
        } else {
            table!.indices.length.should.be.equal(1);
        }

        await queryRunner.dropIndex(table!, table!.indices[0]);

        table = await queryRunner.getTable("student");
        // CockroachDB also stores indices for relation columns
        if (connection.driver instanceof CockroachDriver) {
            table!.indices.length.should.be.equal(2);
        } else {
            table!.indices.length.should.be.equal(0);
        }

        await queryRunner.executeMemoryDownSql();

        table = await queryRunner.getTable("student");
        // CockroachDB also stores indices for relation columns
        if (connection.driver instanceof CockroachDriver) {
            table!.indices.length.should.be.equal(3);
        } else {
            table!.indices.length.should.be.equal(1);
        }

        await queryRunner.release();
    })));

});
