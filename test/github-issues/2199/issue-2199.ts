import { expect } from "chai";
import "reflect-metadata";
import { Connection } from "../../../src/connection/Connection";
import { SqlServerDriver } from '../../../src/driver/sqlserver/SqlServerDriver';
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Bar } from "./entity/Bar";

describe("github issues > #2199 - Inserting value for @PrimaryGeneratedColumn() for mysql, sqlite and mssql", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql", "mariadb", "sqlite", "better-sqlite3", "mssql"],
        schemaCreate: true,
        dropSchema: true
    }));

    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should allow to explicitly insert primary key value", () => Promise.all(connections.map(async connection => {

        const firstBarQuery =  connection.manager.create(Bar, {
             id: 10,
            description: "forced id value"
        });
        const firstBar = await connection.manager.save(firstBarQuery);
        expect(firstBar.id).to.eql(10);

        // Mysql stores and tracks AUTO_INCREMENT value for each table,
        // If the new value is higher than the current maximum value or not specified (use DEFAULT),
        // the AUTO_INCREMENT value is updated, so the next value will be higher.
        const secondBarQuery =  connection.manager.create(Bar, {
            description: "default next id value"
        });
        const secondBar = await connection.manager.save(secondBarQuery);
        expect(secondBar.id).to.eql(firstBarQuery.id + 1);

        // If the new value is lower than the current maximum value,
        // the AUTO_INCREMENT value remains unchanged.
        const thirdBarQuery =  connection.manager.create(Bar, {
            id: 5,
            description: "lower forced id value"
        });
        const thirdBar = await connection.manager.save(thirdBarQuery);
        expect(thirdBar.id).to.eql(5);
    })));

    it("should reset mssql's INSERT_IDENTITY flag correctly after failed queries", () => Promise.all(connections
        .filter(connection => connection.driver instanceof SqlServerDriver)
        .map(async connection => {
            // Run a query that failes at the database level
            await expect(connection.createQueryBuilder()
                .insert()
                .into(Bar)
                .values({
                    id: 20,
                    description: () => "NONEXISTINGFUNCTION()",
                })
                .execute()
            ).to.be.rejectedWith("Error: 'NONEXISTINGFUNCTION' is not a recognized built-in function name.");
            // And now check that IDENTITY_INSERT is disabled by inserting something without an ID value and see if that works
            const successfulBarQuery = connection.manager.create(Bar, {
                description: "default id value"
            });
            const bar = await connection.manager.save(successfulBarQuery);
            expect(bar.id).to.be.a('number');
    })));
});
