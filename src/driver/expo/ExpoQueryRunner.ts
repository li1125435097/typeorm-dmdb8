import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {QueryFailedError} from "../../error/QueryFailedError";
import {AbstractSqliteQueryRunner} from "../sqlite-abstract/AbstractSqliteQueryRunner";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {ExpoDriver} from "./ExpoDriver";
import {Broadcaster} from "../../subscriber/Broadcaster";
import { QueryResult } from "../../query-runner/QueryResult";

// Needed to satisfy the Typescript compiler
interface IResultSet {
    insertId: number | undefined;
    rowsAffected: number;
    rows: {
        length: number;
        item: (idx: number) => any;
        _array: any[];
    };
}
interface ITransaction {
    executeSql: (
        sql: string,
        args: any[] | undefined,
        ok: (tsx: ITransaction, resultSet: IResultSet) => void,
        fail: (tsx: ITransaction, err: any) => void
    ) => void;
}

/**
 * Runs queries on a single sqlite database connection.
 */
export class ExpoQueryRunner extends AbstractSqliteQueryRunner {

    /**
     * Database driver used by connection.
     */
    driver: ExpoDriver;

    /**
     * Database transaction object
     */
    private transaction?: ITransaction;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: ExpoDriver) {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
    }

    /**
     * Starts transaction. Within Expo, all database operations happen in a
     * transaction context, so issuing a `BEGIN TRANSACTION` command is
     * redundant and will result in the following error:
     *
     * `Error: Error code 1: cannot start a transaction within a transaction`
     *
     * Instead, we keep track of a `Transaction` object in `this.transaction`
     * and continue using the same object until we wish to commit the
     * transaction.
     */
    async startTransaction(): Promise<void> {
        this.isTransactionActive = true;
        try {
            await this.broadcaster.broadcast('BeforeTransactionStart');
        } catch (err) {
            this.isTransactionActive = false;
            throw err;
        }

        if (this.transactionDepth > 0) {
            await this.query(`SAVEPOINT typeorm_${this.transactionDepth}`);
        }
        this.transactionDepth += 1;

        await this.broadcaster.broadcast('AfterTransactionStart');
    }

    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     * Since Expo will automatically commit the transaction once all the
     * callbacks of the transaction object have been completed, "committing" a
     * transaction in this driver's context means that we delete the transaction
     * object and set the stage for the next transaction.
     */
    async commitTransaction(): Promise<void> {
        if (!this.isTransactionActive && typeof this.transaction === "undefined")
            throw new TransactionNotStartedError();

        await this.broadcaster.broadcast('BeforeTransactionCommit');

        if (this.transactionDepth > 1) {
            await this.query(`RELEASE SAVEPOINT typeorm_${this.transactionDepth - 1}`);
        } else {
            this.transaction = undefined;
            this.isTransactionActive = false;
        }
        this.transactionDepth -= 1;

        await this.broadcaster.broadcast('AfterTransactionCommit');
    }

    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     * This method's functionality is identical to `commitTransaction()` because
     * the transaction lifecycle is handled within the Expo transaction object.
     * Issuing separate statements for `COMMIT` or `ROLLBACK` aren't necessary.
     */
    async rollbackTransaction(): Promise<void> {
        if (!this.isTransactionActive && typeof this.transaction === "undefined")
            throw new TransactionNotStartedError();

        await this.broadcaster.broadcast('BeforeTransactionRollback');

        if (this.transactionDepth > 1) {
            await this.query(`ROLLBACK TO SAVEPOINT typeorm_${this.transactionDepth - 1}`);
        } else {
            this.transaction = undefined;
            this.isTransactionActive = false;
        }
        this.transactionDepth -= 1;

        await this.broadcaster.broadcast('AfterTransactionRollback');
    }

    /**
     * Called before migrations are run.
     */
    async beforeMigration(): Promise<void> {
        const databaseConnection = await this.connect();
        return new Promise((ok, fail) => {
            databaseConnection.exec(
                [{ sql: 'PRAGMA foreign_keys = OFF;', args: [] }],
                false,
                (err: any) => err ? fail(err) : ok()
            );
        })
    }

    /**
     * Called after migrations are run.
     */
    async afterMigration(): Promise<void> {
        const databaseConnection = await this.connect();
        return new Promise((ok, fail) => {
            databaseConnection.exec(
                [{ sql: 'PRAGMA foreign_keys = ON;', args: [] }],
                false,
                (err: any) => err ? fail(err) : ok()
            );
        })
    }

    /**
     * Executes a given SQL query.
     */
    async query(query: string, parameters?: any[], useStructuredResult = false): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        return new Promise<any>(async (ok, fail) => {
            const databaseConnection = await this.connect();
            this.driver.connection.logger.logQuery(query, parameters, this);
            const queryStartTime = +new Date();
            // All Expo SQL queries are executed in a transaction context
            databaseConnection.transaction(async (transaction: ITransaction) => {
                if (typeof this.transaction === "undefined") {
                    await this.startTransaction();
                    this.transaction = transaction;
                }
                this.transaction.executeSql(query, parameters, (t: ITransaction, raw: IResultSet) => {
                    // log slow queries if maxQueryExecution time is set
                    const maxQueryExecutionTime = this.driver.options.maxQueryExecutionTime;
                    const queryEndTime = +new Date();
                    const queryExecutionTime = queryEndTime - queryStartTime;
                    if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime) {
                        this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);
                    }

                    const result = new QueryResult();

                    // return id of inserted row, if query was insert statement.
                    if (query.substr(0, 11) === "INSERT INTO") {
                        result.raw = raw.insertId;
                    }

                    if (raw?.hasOwnProperty('rowsAffected')) {
                        result.affected = raw.rowsAffected;
                    }

                    if (raw?.hasOwnProperty('rows')) {
                        let resultSet = [];
                        for (let i = 0; i < raw.rows.length; i++) {
                            resultSet.push(raw.rows.item(i));
                        }

                        result.raw = resultSet;
                        result.records = resultSet;
                    }

                    if (useStructuredResult) {
                        ok(result);
                    } else {
                        ok(result.raw);
                    }
                }, (t: ITransaction, err: any) => {
                    this.driver.connection.logger.logQueryError(err, query, parameters, this);
                    fail(new QueryFailedError(query, parameters, err));
                });
            }, async (err: any) => {
                await this.rollbackTransaction();
                fail(err)
            }, () => {
                this.isTransactionActive = false;
                this.transaction = undefined;
            });
        });
    }
}
