import "reflect-metadata";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { Foo } from "./entity/foo";
import { expect } from "chai";

describe("github issues > #6990 synchronize drops array columns in postgres if a length is set", () => {
    let connections: Connection[];
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
            }))
    );
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not drop varchar array column on synchronize using postgres driver", () =>
        Promise.all(
            connections.map(async function (connection) {
                const foo = new Foo();
                foo.id = 1;
                foo.varchararray = ["able", "baker", "charlie"];
                await connection.manager.save(foo);

                await connection.synchronize();

                const loadedFoo:
                    | Foo
                    | undefined = await connection.manager.findOne(Foo, 1);

                expect(loadedFoo).to.be.not.empty;
                expect(loadedFoo!.varchararray).to.deep.eq([
                    "able",
                    "baker",
                    "charlie",
                ]);
            })
        ));
});
