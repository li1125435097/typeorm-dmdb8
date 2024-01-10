import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Dummy} from './entity/Dummy';
import {ReadStream} from 'fs';
import {expect} from "chai";

function ingestStream (stream: ReadStream): Promise<any[]> {
    let chunks: any[] = [];
    return new Promise((ok, fail) => {
      stream.on('data', chunk => chunks.push(chunk))
      stream.on('error', fail)
      stream.on('end', () => ok(chunks))
    })
  }

describe("github issues > #7109 stream() bug from 0.2.25 to 0.2.26 with postgresql", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
        enabledDrivers: ["postgres", "mysql", "mariadb", "cockroachdb"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should release the QueryRunner created by a SelectQueryBuilder", () => Promise.all(connections.map(async connection => {
        const values = [{field: "abc"}, {field: "def"}, {field: "ghi"}];
        // First create some test data
        await connection.createQueryBuilder()
            .insert()
            .into(Dummy)
            .values(values)
            .execute();

       // Stream data:
       const stream = await connection.createQueryBuilder().from(Dummy, 'dummy').select('field').stream();
       const streamedEntities = await ingestStream(stream);

       // If the runner is properly released, the test is already successful; this assert is just a sanity check.
       const extractFields = (val: {field: string}) => val.field;
       expect(streamedEntities.map(extractFields)).to.have.members(values.map(extractFields));

    })));
});
