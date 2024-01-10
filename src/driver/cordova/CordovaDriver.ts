import {AbstractSqliteDriver} from "../sqlite-abstract/AbstractSqliteDriver";
import {CordovaConnectionOptions} from "./CordovaConnectionOptions";
import {CordovaQueryRunner} from "./CordovaQueryRunner";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {Connection} from "../../connection/Connection";
import {DriverOptionNotSetError} from "../../error/DriverOptionNotSetError";
import {DriverPackageNotInstalledError} from "../../error/DriverPackageNotInstalledError";
import {ReplicationMode} from "../types/ReplicationMode";

// needed for typescript compiler
interface Window {
    sqlitePlugin: any;
}

declare let window: Window;

export class CordovaDriver extends AbstractSqliteDriver {
    options: CordovaConnectionOptions;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        super(connection);

        // this.connection = connection;
        // this.options = connection.options as CordovaConnectionOptions;
        this.database = this.options.database;

        // validate options to make sure everything is set
        if (!this.options.database)
            throw new DriverOptionNotSetError("database");

        if (!this.options.location)
            throw new DriverOptionNotSetError("location");

        // load sqlite package
        this.loadDependencies();
    }


    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Closes connection with database.
     */
    async disconnect(): Promise<void> {
        this.queryRunner = undefined;

        return new Promise<void>((ok, fail) => {
            this.databaseConnection.close(ok, fail);
        });
    }

    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode: ReplicationMode): QueryRunner {
        if (!this.queryRunner)
            this.queryRunner = new CordovaQueryRunner(this);

        return this.queryRunner;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates connection with the database.
     */
    protected async createDatabaseConnection() {
        const options = Object.assign({}, {
            name: this.options.database,
            location: this.options.location,
        }, this.options.extra || {});

        const connection = await new Promise<any>((resolve) => {
            this.sqlite.openDatabase(options, (db: any) => resolve(db))
        })

        await new Promise<void>((ok, fail) => {
            // we need to enable foreign keys in sqlite to make sure all foreign key related features
            // working properly. this also makes onDelete to work with sqlite.
            connection.executeSql(
                `PRAGMA foreign_keys = ON;`,
                [],
                () => ok(),
                (err: any) => fail(err)
            );
        })

        return connection;
    }

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        try {
            const sqlite = this.options.driver || window.sqlitePlugin;
            this.sqlite = sqlite;

        } catch (e) {
            throw new DriverPackageNotInstalledError("Cordova-SQLite", "cordova-sqlite-storage");
        }
    }
}
