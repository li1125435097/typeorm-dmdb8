import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";

describe("github issues > #1652 Multiple primary key defined", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    after(() => closeTestingConnections(connections));

    it("should correctly create table when multiple primary keys defined and one of them is generated", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("post");
        table!.findColumnByName("id")!.isPrimary.should.be.true;
        table!.findColumnByName("id")!.isGenerated.should.be.true;
        table!.findColumnByName("id")!.generationStrategy!.should.be.equal("increment");
        table!.findColumnByName("name")!.isPrimary.should.be.true;
        await queryRunner.release();

    })));

});
