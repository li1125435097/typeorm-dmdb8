import {createConnection} from "../globals";
import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";
import {Connection} from "../connection/Connection";
import * as yargs from "yargs";
import chalk from "chalk";
import { PlatformTools } from "../platform/PlatformTools";

/**
 * Clear cache command.
 */
export class CacheClearCommand implements yargs.CommandModule {

    command = "cache:clear";
    describe = "Clears all data stored in query runner cache.";

    builder(args: yargs.Argv) {
        return args
            .option("connection", {
                alias: "c",
                default: "default",
                describe: "Name of the connection on which run a query."
            })
            .option("config", {
                alias: "f",
                default: "ormconfig",
                describe: "Name of the file with connection configuration."
            });
    }

    async handler(args: yargs.Arguments) {

        let connection: Connection|undefined = undefined;
        try {
            const connectionOptionsReader = new ConnectionOptionsReader({
                root: process.cwd(),
                configName: args.config as any
            });
            const connectionOptions = await connectionOptionsReader.get(args.connection as any);
            Object.assign(connectionOptions, {
                subscribers: [],
                synchronize: false,
                migrationsRun: false,
                dropSchema: false,
                logging: ["schema"]
            });
            connection = await createConnection(connectionOptions);

            if (!connection.queryResultCache) {
                PlatformTools.logCmdErr("Cache is not enabled. To use cache enable it in connection configuration.");
                return;
            }

            await connection.queryResultCache.clear();
            console.log(chalk.green("Cache was successfully cleared"));

            if (connection) await connection.close();

        } catch (err) {
            if (connection) await (connection as Connection).close();

            PlatformTools.logCmdErr("Error during cache clear.", err);

            process.exit(1);
        }
    }

}
