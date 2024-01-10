import "reflect-metadata";
import {Connection} from "../../../src";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {ClusterCluster as ClusterClusterPg} from "./entity/TestPostgres";
import {ClusterCluster as ClusterClusterMssql} from "./entity/TestMssql";

describe("github issues > #7276 Schema sync not able to find diff correctly and executes same queries on every run", () => {
    describe("postgres", () => {
        let connections: Connection[];
        before(async () => connections = await createTestingConnections({
            enabledDrivers: ["postgres"],
            schemaCreate: false,
            dropSchema: true,
            entities: [ClusterClusterPg],
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
    })

    describe("mssql", () => {
        let connections: Connection[];
        before(async () => connections = await createTestingConnections({
            enabledDrivers: ["mssql"],
            schemaCreate: false,
            dropSchema: true,
            entities: [ClusterClusterMssql],
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
    })
});
