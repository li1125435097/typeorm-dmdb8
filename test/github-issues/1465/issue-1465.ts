import "reflect-metadata";
import {assert} from "chai";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Account} from "./entity/Account";
import {AccountActivationToken} from "./entity/AccountActivationToken";

describe("github issues > #1465 save child and parent entity", () => {

    let connections: Connection[] = [];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql", "mariadb", "sqlite", "better-sqlite3", "sqljs"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));


    it("account property in accountActivationToken should not be null", () => Promise.all(connections.map(async connection => {

        const account = new Account();
        account.username = "test";
        account.password = "123456";
        account.accountActivationToken = new AccountActivationToken("XXXXXXXXXXXXXXXXXX", new Date());

        const savedAccount = await connection.manager.save(account);
        assert.isNotNull(savedAccount.accountActivationToken.account);

    })));

});
