import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src";

describe("github issues > #3151 'uuid' in PrimaryGeneratedColumn causes Many-to-Many Relationship to Fail", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should work correctly", () => Promise.all(connections.map(async connection => {
        await connection.synchronize();
    })));

});
