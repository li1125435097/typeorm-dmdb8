import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {Post} from "./entity/Post";

describe("github issues > #1898 Simple JSON breaking in @next", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["sqlite", "better-sqlite3"],
            schemaCreate: true,
            dropSchema: true
        });
    });
    after(() => closeTestingConnections(connections));

    it("should correctly persist", () => Promise.all(connections.map(async connection => {
        const post = new Post();
        post.type = "post";
        await connection.getRepository(Post).save(post);
    })));

});
