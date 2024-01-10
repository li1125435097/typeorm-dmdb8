import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";
import {CommandUtils} from "./CommandUtils";
import * as yargs from "yargs";
import chalk from "chalk";
import { PlatformTools } from "../platform/PlatformTools";

/**
 * Generates a new entity.
 */
export class EntityCreateCommand implements yargs.CommandModule {
    command = "entity:create";
    describe = "Generates a new entity.";

    builder(args: yargs.Argv) {
        return args
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which to run a query"
            })
            .option("n", {
                alias: "name",
                describe: "Name of the entity class.",
                demand: true
            })
            .option("d", {
                alias: "dir",
                describe: "Directory where entity should be created."
            })
            .option("f", {
                alias: "config",
                default: "ormconfig",
                describe: "Name of the file with connection configuration."
            });
    }

    async handler(args: yargs.Arguments) {
        try {
            const fileContent = EntityCreateCommand.getTemplate(args.name as any);
            const filename = args.name + ".ts";
            let directory = args.dir as string | undefined;

            // if directory is not set then try to open tsconfig and find default path there
            if (!directory) {
                try {
                    const connectionOptionsReader = new ConnectionOptionsReader({
                        root: process.cwd(),
                        configName: args.config as any
                    });
                    const connectionOptions = await connectionOptionsReader.get(args.connection as any);
                    directory = connectionOptions.cli ? (connectionOptions.cli.entitiesDir || "") : "";
                } catch (err) { }
            }

            if (directory && !directory.startsWith("/")) {
                directory = process.cwd() + "/" + directory;
            }
            const path = (directory ? (directory + "/") : "") + filename;
            const fileExists = await CommandUtils.fileExists(path);
            if (fileExists) {
                throw `File ${chalk.blue(path)} already exists`;
            }
            await CommandUtils.createFile(path, fileContent);
            console.log(chalk.green(`Entity ${chalk.blue(path)} has been created successfully.`));

        } catch (err) {
            PlatformTools.logCmdErr("Error during entity creation:", err);
            process.exit(1);
        }
    }

    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------

    /**
     * Gets contents of the entity file.
     */
    protected static getTemplate(name: string): string {
        return `import {Entity} from "typeorm";

@Entity()
export class ${name} {

}
`;
    }

}
