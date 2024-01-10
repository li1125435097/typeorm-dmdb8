import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {TestEntity} from "./entity/TestEntity";
import {expect} from "chai";

describe("github issues > #1014 Transaction doesn't rollback", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should rollback transaction if some operation failed in it", () => Promise.all(connections.map(async connection => {

        const testEntity = new TestEntity();
        testEntity.name = "Hello Test";
        await connection.manager.save(testEntity, { reload: true });

        let error: any;
        try {
            await connection.transaction(async manager => {
                await manager.remove(testEntity);

                throw new Error();
            });
        } catch (err) { error = err; }

        expect(error).to.be.instanceof(Error);
        const loadedTestEntity = await connection.manager.findOne(TestEntity, 1);
        expect(loadedTestEntity).not.to.be.undefined;
        loadedTestEntity!.should.be.eql({ id: 1, name: "Hello Test" });
    })));

});
