import "reflect-metadata";
import {Connection} from "../../../src";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {TestEntity} from "./entity/Test";

describe("github issues > #7541 Column of type `enum` throws missing properties error", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        enabledDrivers: ["postgres"],
        schemaCreate: false,
        dropSchema: true,
        entities: [TestEntity],
    }));
    after(() => closeTestingConnections(connections));

    it("should recognize model changes", () => Promise.all(connections.map(async connection => {
        const sqlInMemory = await connection.driver.createSchemaBuilder().log();
        sqlInMemory.upQueries.length.should.be.greaterThan(0);
        sqlInMemory.downQueries.length.should.be.greaterThan(0);
    })));

    it("should not generate queries when no model changes", () => Promise.all(connections.map(async connection => {
        await connection.driver.createSchemaBuilder().build();
        const sqlInMemory = await connection.driver.createSchemaBuilder().log();
        sqlInMemory.upQueries.length.should.be.equal(0);
        sqlInMemory.downQueries.length.should.be.equal(0);
    })));
});
