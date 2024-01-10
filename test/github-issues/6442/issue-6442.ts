import "reflect-metadata";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
    setupSingleTestingConnection
} from "../../utils/test-utils";
import { Connection, createConnection } from "../../../src";
import { fail } from "assert";
import { Query } from "../../../src/driver/Query";
import { MysqlConnectionOptions } from "../../../src/driver/mysql/MysqlConnectionOptions";

describe("github issues > #6442 JoinTable does not respect inverseJoinColumns referenced column width", () => {
    let connections: Connection[];

    before(async () => {
        return connections = await createTestingConnections({
            entities: [__dirname + "/entity/v1/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: ["mysql"]
        });
    });
    beforeEach(async () => await reloadTestingDatabases(connections));
    after(async () => await closeTestingConnections(connections));

    it("should generate column widths equal to the referenced column widths", async () => {

        await Promise.all(connections.map(async (connection) => {
            const options = setupSingleTestingConnection(
                connection.options.type,
                {
                    name: `${connection.name}-v2`,
                    entities: [__dirname + "/entity/v2/*{.js,.ts}"],
                    dropSchema: false,
                    schemaCreate: false
                }
            ) as MysqlConnectionOptions;

            if (!options) {
                await connection.close();
                fail();
            }

            const migrationConnection = await createConnection(options);
            try {
                const sqlInMemory = await migrationConnection.driver
                    .createSchemaBuilder()
                    .log();

                const upQueries = sqlInMemory.upQueries.map(
                    (query: Query) => query.query
                );

                upQueries.should.eql([
                    "CREATE TABLE `foo_bars` (`foo_id` int(10) UNSIGNED NOT NULL, `bar_id` int(10) UNSIGNED NOT NULL, INDEX `IDX_319290776f044043e3ef3ba5a8` (`foo_id`), INDEX `IDX_b7fd4be386fa7cdb87ef8b12b6` (`bar_id`), PRIMARY KEY (`foo_id`, `bar_id`)) ENGINE=InnoDB",
                    "ALTER TABLE `foo_bars` ADD CONSTRAINT `FK_319290776f044043e3ef3ba5a8d` FOREIGN KEY (`foo_id`) REFERENCES `foo_entity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE",
                    "ALTER TABLE `foo_bars` ADD CONSTRAINT `FK_b7fd4be386fa7cdb87ef8b12b69` FOREIGN KEY (`bar_id`) REFERENCES `bar_entity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE"
                ]);

            } finally {
                await connection.close();
                await migrationConnection.close();
            }
        }));
    });
});
