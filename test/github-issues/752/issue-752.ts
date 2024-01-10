import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Product} from "./entity/Product";

describe("github issues > #752 postgres - count query fails for empty table", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should return user by a given email and proper escape 'user' keyword", () => Promise.all(connections.map(async connection => {

        const product = new Product();
        product.name = "Apple";
        product.productVersionId = 1;
        await connection.manager.save(product);

        const count = await connection.getRepository(Product).count({ productVersionId: 1 });
        count.should.be.equal(1);
    })));

});
