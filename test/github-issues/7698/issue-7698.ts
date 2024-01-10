import "reflect-metadata";
import { Connection } from "../../../src";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Test } from "./entity/Test";

describe("github issues > #7698 MariaDB STORED columns don't accept [NULL | NOT NULL]", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ["mariadb"],
            entities: [Test],
            schemaCreate: false,
            dropSchema: true
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not generate queries with NULL or NOT NULL for stored columns in mariadb", () => Promise.all(connections.map(async connection => {
        await connection.driver.createSchemaBuilder().build();
        const sqlInMemory = await connection.driver.createSchemaBuilder().log();
        sqlInMemory.upQueries.length.should.be.greaterThan(0);
    })));
});
