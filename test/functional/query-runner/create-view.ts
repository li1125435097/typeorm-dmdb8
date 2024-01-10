import "reflect-metadata";
import { Connection } from "../../../src";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { View } from "../../../src/schema-builder/view/View";
import { expect } from "chai";

describe("query runner > create view", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/view/*{.js,.ts}"],
            enabledDrivers: ["postgres", "oracle"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly create VIEW and revert creation", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        const view = new View({
            name: "new_post_view",
            expression: `SELECT * from "post"`
        });
        await queryRunner.createView(view);

        let postView = await queryRunner.getView("new_post_view");
        expect(postView).to.be.exist;

        await queryRunner.executeMemoryDownSql();

        postView = await queryRunner.getView("new_post_view");
        expect(postView).to.be.not.exist;

        await queryRunner.release();
    })));

    it("should correctly create MATERIALIZED VIEW and revert creation", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        const view = new View({
            name: "new_post_materialized_view",
            expression: `SELECT * from "post"`,
            materialized: true
        });
        await queryRunner.createView(view);

        let postMatView = await queryRunner.getView("new_post_materialized_view");
        expect(postMatView).to.be.exist;
        expect(postMatView!.materialized).to.be.true

        await queryRunner.executeMemoryDownSql();

        postMatView = await queryRunner.getView("new_post_materialized_view");
        expect(postMatView).to.be.not.exist;

        await queryRunner.release();
    })));

});
