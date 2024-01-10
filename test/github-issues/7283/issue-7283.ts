import "reflect-metadata";
import {Connection} from "../../../src";
import {createTestingConnections, closeTestingConnections} from "../../utils/test-utils";
import {AccessEvent} from "./entity/AccessEvent";
import {Employee} from "./entity/Employee";
import {expect} from "chai";

describe("github issues > #7283 Generating Migration on ManyToOne/OneToMany + Primary enum column results in missing enum type in migration output", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        migrations: [],
        enabledDrivers: ["mysql", "mariadb", "postgres"],
        schemaCreate: false,
        dropSchema: true,
        entities: [AccessEvent, Employee],
    }));
    after(() => closeTestingConnections(connections));

    it("should create tables with enum primary column", () => Promise.all(connections.map(async connection => {
        await connection.driver.createSchemaBuilder().build();
        const queryRunner = connection.createQueryRunner();

        // ManyToOne
        const table = await queryRunner.getTable("access_event");
        const column = table!.findColumnByName("employeeProvider");
        expect(column!.enum).to.deep.equal([ "msGraph", "atlassian" ]);

        // ManyToMany
        const table2 = await queryRunner.getTable("access_event_employees_employee");
        const column2 = table2!.findColumnByName("employeeProvider");
        expect(column2!.enum).to.deep.equal([ "msGraph", "atlassian" ]);

        await queryRunner.release();
    })));
});
