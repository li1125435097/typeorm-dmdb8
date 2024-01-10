import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import {File} from "./entity/file.entity";
import {TreeRepository} from "../../../src";

describe("github issues > #2518 TreeRepository.findDescendantsTree does not load descendants when relationship id property exist", () => {
    let connections: Connection[];
    before(
        async () =>
        (connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            // data type text isn't compatible with oracle
            enabledDrivers: ["postgres", "cockroachdb", "mariadb", "mssql", "mysql", "sqlite", "better-sqlite3", "sqljs"]
        }))
    );

    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should load descendants when findDescendantsTree is called for a tree entity", () =>
        Promise.all(
            connections.map(async connection => {
                const repo: TreeRepository<File> = connection.getTreeRepository(File);
                const root: File = await repo.save({ id: 1, name: "root" } as File);
                const child = await repo.save({ id: 2, name: "child", parent: root } as File);
                expect(child.parentId).to.be.equal(1);
                const file: File | any = await repo.createQueryBuilder("file")
                    .where("file.id = :id", { id: 1 })
                    .getOne();
                await repo.findDescendantsTree(file);
                expect(file.children.length).to.be.greaterThan(0);
            })
        )
    );

    it("should load descendants when findTrees are called", () =>
        Promise.all(
            connections.map(async connection => {
                const repo = connection.getTreeRepository(File);
                const root: File = await repo.save({ id: 1, name: "root" } as File);
                const child = await repo.save({ id: 2, name: "child", parent: root } as File);
                expect(child.parentId).to.be.equal(1);
                const trees: File[] = await repo.findTrees();
                expect(trees).to.be.an("array");
                expect(trees[0].children.length).to.be.greaterThan(0);
            })
        )
    );
});
