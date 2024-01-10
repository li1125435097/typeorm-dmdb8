import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {TestEntity1} from "./entity/TestEntity1";

describe("github issues > #1504 Cannot eagerly query Entity with relation more than 3 levels deep", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["postgres"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not throw an error", () => Promise.all(connections.map(async connection => {

        await connection
            .getRepository(TestEntity1)
            .findOne(1, { relations: [
                "Entity2",
                "Entity2.Entity3",
                "Entity2.Entity3.Entity4",
            ]});

    })));

});
