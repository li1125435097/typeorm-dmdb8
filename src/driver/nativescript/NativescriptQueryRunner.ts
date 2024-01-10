import {ObjectLiteral} from "../../common/ObjectLiteral";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {QueryFailedError} from "../../error/QueryFailedError";
import {AbstractSqliteQueryRunner} from "../sqlite-abstract/AbstractSqliteQueryRunner";
import {NativescriptDriver} from "./NativescriptDriver";
import {Broadcaster} from "../../subscriber/Broadcaster";
import { QueryResult } from "../../query-runner/QueryResult";

/**
 * Runs queries on a single sqlite database connection.
 */
export class NativescriptQueryRunner extends AbstractSqliteQueryRunner {

    /**
     * Database driver used by connection.
     */
    driver: NativescriptDriver;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: NativescriptDriver) {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
    }

    /**
     * Called before migrations are run.
     */
    async beforeMigration(): Promise<void> {
        await this.query(`PRAGMA foreign_keys = OFF`);
    }

    /**
     * Called after migrations are run.
     */
    async afterMigration(): Promise<void> {
        await this.query(`PRAGMA foreign_keys = ON`);
    }

    /**
     * Executes a given SQL query.
     */
    async query(query: string, parameters?: any[], useStructuredResult = false): Promise<any> {

        if (this.isReleased) {
            throw new QueryRunnerAlreadyReleasedError();
        }

        const connection = this.driver.connection;

        return new Promise(async (ok, fail) => {

            const databaseConnection = await this.connect();
            const isInsertQuery = query.substr(0, 11) === "INSERT INTO";
            connection.logger.logQuery(query, parameters, this);

            const handler = (err: any, raw: any) => {

                // log slow queries if maxQueryExecution time is set
                const maxQueryExecutionTime = this.driver.options.maxQueryExecutionTime;
                const queryEndTime = +new Date();
                const queryExecutionTime = queryEndTime - queryStartTime;
                
                if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime) {
                    connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);
                }
                
                if (err) {
                    connection.logger.logQueryError(err, query, parameters, this);
                    fail(new QueryFailedError(query, parameters, err));
                }

                const result = new QueryResult();
                result.raw = raw;

                if (!isInsertQuery && Array.isArray(raw)) {
                    result.records = raw;
                }

                if (useStructuredResult) {
                    ok(result);
                } else {
                    ok(result.raw);
                }
                
            };
            const queryStartTime = +new Date();

            if (isInsertQuery) {
                databaseConnection.execSQL(query, parameters, handler);
            } else {
                databaseConnection.all(query, parameters, handler);
            } 
        });
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    protected parametrize(objectLiteral: ObjectLiteral, startIndex: number = 0): string[] {
        return Object.keys(objectLiteral).map((key, index) => `"${key}"` + "=?");
    }
}
