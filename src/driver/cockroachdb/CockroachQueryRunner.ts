import {QueryResult} from "../../query-runner/QueryResult";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {Table} from "../../schema-builder/table/Table";
import {TableIndex} from "../../schema-builder/table/TableIndex";
import {TableForeignKey} from "../../schema-builder/table/TableForeignKey";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {View} from "../../schema-builder/view/View";
import {Query} from "../Query";
import {CockroachDriver} from "./CockroachDriver";
import {ReadStream} from "../../platform/PlatformTools";
import {QueryFailedError} from "../../error/QueryFailedError";
import {Broadcaster} from "../../subscriber/Broadcaster";
import {TableIndexOptions} from "../../schema-builder/options/TableIndexOptions";
import {TableUnique} from "../../schema-builder/table/TableUnique";
import {BaseQueryRunner} from "../../query-runner/BaseQueryRunner";
import {OrmUtils} from "../../util/OrmUtils";
import {TableCheck} from "../../schema-builder/table/TableCheck";
import {ColumnType} from "../types/ColumnTypes";
import {IsolationLevel} from "../types/IsolationLevel";
import {TableExclusion} from "../../schema-builder/table/TableExclusion";
import {ReplicationMode} from "../types/ReplicationMode";
import {TypeORMError} from "../../error";
import {MetadataTableType} from "../types/MetadataTableType";

/**
 * Runs queries on a single postgres database connection.
 */
export class CockroachQueryRunner extends BaseQueryRunner implements QueryRunner {

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Database driver used by connection.
     */
    driver: CockroachDriver;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Promise used to obtain a database connection for a first time.
     */
    protected databaseConnectionPromise: Promise<any>;

    /**
     * Special callback provided by a driver used to release a created connection.
     */
    protected releaseCallback: Function;

    /**
     * Stores all executed queries to be able to run them again if transaction fails.
     */
    protected queries: { query: string, parameters?: any[] }[] = [];

    /**
     * Indicates if running queries must be stored
     */
    protected storeQueries: boolean = false;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: CockroachDriver, mode: ReplicationMode) {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.mode = mode;
        this.broadcaster = new Broadcaster(this);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    connect(): Promise<any> {
        if (this.databaseConnection)
            return Promise.resolve(this.databaseConnection);

        if (this.databaseConnectionPromise)
            return this.databaseConnectionPromise;

        if (this.mode === "slave" && this.driver.isReplicated)  {
            this.databaseConnectionPromise = this.driver.obtainSlaveConnection().then(([ connection, release]: any[]) => {
                this.driver.connectedQueryRunners.push(this);
                this.databaseConnection = connection;
                this.releaseCallback = release;
                return this.databaseConnection;
            });

        } else { // master
            this.databaseConnectionPromise = this.driver.obtainMasterConnection().then(([connection, release]: any[]) => {
                this.driver.connectedQueryRunners.push(this);
                this.databaseConnection = connection;
                this.releaseCallback = release;
                return this.databaseConnection;
            });
        }

        return this.databaseConnectionPromise;
    }

    /**
     * Releases used database connection.
     * You cannot use query runner methods once its released.
     */
    release(): Promise<void> {
        this.isReleased = true;
        if (this.releaseCallback)
            this.releaseCallback();

        const index = this.driver.connectedQueryRunners.indexOf(this);
        if (index !== -1) this.driver.connectedQueryRunners.splice(index);

        return Promise.resolve();
    }

    /**
     * Starts transaction.
     */
    async startTransaction(isolationLevel?: IsolationLevel): Promise<void> {
        this.isTransactionActive = true;
        try {
            await this.broadcaster.broadcast('BeforeTransactionStart');
        } catch (err) {
            this.isTransactionActive = false;
            throw err;
        }

        if (this.transactionDepth === 0) {
            await this.query("START TRANSACTION");
            await this.query("SAVEPOINT cockroach_restart");
            if (isolationLevel) {
                await this.query("SET TRANSACTION ISOLATION LEVEL " + isolationLevel);
            }
        } else {
            await this.query(`SAVEPOINT typeorm_${this.transactionDepth}`)
        }

        this.transactionDepth += 1;
        this.storeQueries = true;

        await this.broadcaster.broadcast('AfterTransactionStart');
    }

    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    async commitTransaction(): Promise<void> {
        if (!this.isTransactionActive)
            throw new TransactionNotStartedError();

        await this.broadcaster.broadcast('BeforeTransactionCommit');

        if (this.transactionDepth > 1) {
            await this.query(`RELEASE SAVEPOINT typeorm_${this.transactionDepth - 1}`);
            this.transactionDepth -= 1;
        } else {
            this.storeQueries = false;
            try {
                await this.query("RELEASE SAVEPOINT cockroach_restart");
                await this.query("COMMIT");
                this.queries = [];
                this.isTransactionActive = false;
                this.transactionDepth -= 1;

            } catch (e) {
                if (e.code === "40001") {
                    await this.query("ROLLBACK TO SAVEPOINT cockroach_restart");
                    for (const q of this.queries) {
                        await this.query(q.query, q.parameters);
                    }
                    await this.commitTransaction();
                }
            }
        }

        await this.broadcaster.broadcast('AfterTransactionCommit');
    }

    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    async rollbackTransaction(): Promise<void> {
        if (!this.isTransactionActive)
            throw new TransactionNotStartedError();

        await this.broadcaster.broadcast('BeforeTransactionRollback');

        if (this.transactionDepth > 1) {
            await this.query(`ROLLBACK TO SAVEPOINT typeorm_${this.transactionDepth - 1}`);
        } else {
            this.storeQueries = false;
            await this.query("ROLLBACK");
            this.queries = [];
            this.isTransactionActive = false;
        }
        this.transactionDepth -= 1;

        await this.broadcaster.broadcast('AfterTransactionRollback');
    }

    /**
     * Executes a given SQL query.
     */
    async query(query: string, parameters?: any[], useStructuredResult = false): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const databaseConnection = await this.connect();
        this.driver.connection.logger.logQuery(query, parameters, this);
        const queryStartTime = +new Date();

        if (this.isTransactionActive && this.storeQueries) {
            this.queries.push({ query, parameters });
        }

        try {
            const raw = await new Promise<any>((ok, fail) => {
                databaseConnection.query(query, parameters, (err: any, raw: any) => err ? fail(err) : ok(raw))
            });

            // log slow queries if maxQueryExecution time is set
            const maxQueryExecutionTime = this.driver.options.maxQueryExecutionTime;
            const queryEndTime = +new Date();
            const queryExecutionTime = queryEndTime - queryStartTime;
            if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime) {
                this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);
            }

            const result = new QueryResult();

            if (raw.hasOwnProperty('rowCount')) {
                result.affected = raw.rowCount;
            }

            if (raw.hasOwnProperty('rows')) {
                result.records = raw.rows;
            }

            switch (raw.command) {
                case "DELETE":
                    // for DELETE query additionally return number of affected rows
                    result.raw = [raw.rows, raw.rowCount]
                    break;
                default:
                    result.raw = raw.rows;
            }

            if (useStructuredResult) {
                return result;
            } else {
                return result.raw;
            }
        } catch (err) {
            if (err.code !== "40001") {
                this.driver.connection.logger.logQueryError(err, query, parameters, this);
            }

            throw new QueryFailedError(query, parameters, err);
        }
    }

    /**
     * Returns raw data stream.
     */
    async stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
        const QueryStream = this.driver.loadStreamDependency();
        if (this.isReleased) {
            throw new QueryRunnerAlreadyReleasedError();
        }

        const databaseConnection = await this.connect();
        this.driver.connection.logger.logQuery(query, parameters, this);
        const stream = databaseConnection.query(new QueryStream(query, parameters));

        if (onEnd) {
            stream.on("end", onEnd);
        }

        if (onError) {
            stream.on("error", onError);
        }

        return stream;
    }

    /**
     * Returns all available database names including system databases.
     */
    async getDatabases(): Promise<string[]> {
        return Promise.resolve([]);
    }

    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    async getSchemas(database?: string): Promise<string[]> {
        return Promise.resolve([]);
    }

    /**
     * Checks if database with the given name exist.
     */
    async hasDatabase(database: string): Promise<boolean> {
        const result = await this.query(`SELECT * FROM "pg_database" WHERE "datname" = '${database}'`);
        return result.length ? true : false;
    }

    /**
     * Loads currently using database
     */
    async getCurrentDatabase(): Promise<string> {
        const query = await this.query(`SELECT * FROM current_database()`);
        return query[0]["current_database"];
    }

    /**
     * Checks if schema with the given name exist.
     */
    async hasSchema(schema: string): Promise<boolean> {
        const result = await this.query(`SELECT * FROM "information_schema"."schemata" WHERE "schema_name" = '${schema}'`);
        return result.length ? true : false;
    }

    /**
     * Loads currently using database schema
     */
    async getCurrentSchema(): Promise<string> {
        const query = await this.query(`SELECT * FROM current_schema()`);
        return query[0]["current_schema"];
    }

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(tableOrName: Table|string): Promise<boolean> {
        const parsedTableName = this.driver.parseTableName(tableOrName);

        if (!parsedTableName.schema) {
            parsedTableName.schema = await this.getCurrentSchema();
        }

        const sql = `SELECT * FROM "information_schema"."tables" WHERE "table_schema" = '${parsedTableName.schema}' AND "table_name" = '${parsedTableName.tableName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Checks if column with the given name exist in the given table.
     */
    async hasColumn(tableOrName: Table|string, columnName: string): Promise<boolean> {
        const parsedTableName = this.driver.parseTableName(tableOrName);

        if (!parsedTableName.schema) {
            parsedTableName.schema = await this.getCurrentSchema();
        }

        const sql = `SELECT * FROM "information_schema"."columns" WHERE "table_schema" = '${parsedTableName.schema}' AND "table_name" = '${parsedTableName.tableName}' AND "column_name" = '${columnName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a new database.
     */
    async createDatabase(database: string, ifNotExist?: boolean): Promise<void> {
        const up = `CREATE DATABASE ${ifNotExist ? "IF NOT EXISTS " : ""} "${database}"`;
        const down = `DROP DATABASE "${database}"`;
        await this.executeQueries(new Query(up), new Query(down));
    }

    /**
     * Drops database.
     */
    async dropDatabase(database: string, ifExist?: boolean): Promise<void> {
        const up = `DROP DATABASE ${ifExist ? "IF EXISTS " : ""} "${database}"`;
        const down = `CREATE DATABASE "${database}"`;
        await this.executeQueries(new Query(up), new Query(down));
    }

    /**
     * Creates a new table schema.
     */
    async createSchema(schemaPath: string, ifNotExist?: boolean): Promise<void> {
        const schema = schemaPath.indexOf(".") === -1 ? schemaPath : schemaPath.split(".")[1];

        const up = ifNotExist ? `CREATE SCHEMA IF NOT EXISTS "${schema}"` : `CREATE SCHEMA "${schema}"`;
        const down = `DROP SCHEMA "${schema}" CASCADE`;
        await this.executeQueries(new Query(up), new Query(down));
    }

    /**
     * Drops table schema.
     */
    async dropSchema(schemaPath: string, ifExist?: boolean, isCascade?: boolean): Promise<void> {
        const schema = schemaPath.indexOf(".") === -1 ? schemaPath : schemaPath.split(".")[1];

        const up = ifExist ? `DROP SCHEMA IF EXISTS "${schema}" ${isCascade ? "CASCADE" : ""}` : `DROP SCHEMA "${schema}" ${isCascade ? "CASCADE" : ""}`;
        const down = `CREATE SCHEMA "${schema}"`;
        await this.executeQueries(new Query(up), new Query(down));
    }

    /**
     * Creates a new table.
     */
    async createTable(table: Table, ifNotExist: boolean = false, createForeignKeys: boolean = true, createIndices: boolean = true): Promise<void> {
        if (ifNotExist) {
            const isTableExist = await this.hasTable(table);
            if (isTableExist) return Promise.resolve();
        }
        const upQueries: Query[] = [];
        const downQueries: Query[] = [];

        table.columns
            .filter(column => column.isGenerated && column.generationStrategy === "increment")
            .forEach(column => {
                upQueries.push(new Query(`CREATE SEQUENCE ${this.escapePath(this.buildSequencePath(table, column))}`));
                downQueries.push(new Query(`DROP SEQUENCE ${this.escapePath(this.buildSequencePath(table, column))}`));
            });

        upQueries.push(this.createTableSql(table, createForeignKeys));
        downQueries.push(this.dropTableSql(table));

        // if createForeignKeys is true, we must drop created foreign keys in down query.
        // createTable does not need separate method to create foreign keys, because it create fk's in the same query with table creation.
        if (createForeignKeys)
            table.foreignKeys.forEach(foreignKey => downQueries.push(this.dropForeignKeySql(table, foreignKey)));

        if (createIndices) {
            table.indices
                .filter(index => !index.isUnique)
                .forEach(index => {

                    // new index may be passed without name. In this case we generate index name manually.
                    if (!index.name)
                        index.name = this.connection.namingStrategy.indexName(table, index.columnNames, index.where);
                    upQueries.push(this.createIndexSql(table, index));
                    downQueries.push(this.dropIndexSql(table, index));
                });
        }

        await this.executeQueries(upQueries, downQueries);
    }

    /**
     * Drops the table.
     */
    async dropTable(target: Table|string, ifExist?: boolean, dropForeignKeys: boolean = true, dropIndices: boolean = true): Promise<void> {// It needs because if table does not exist and dropForeignKeys or dropIndices is true, we don't need
        // to perform drop queries for foreign keys and indices.
        if (ifExist) {
            const isTableExist = await this.hasTable(target);
            if (!isTableExist) return Promise.resolve();
        }

        // if dropTable called with dropForeignKeys = true, we must create foreign keys in down query.
        const createForeignKeys: boolean = dropForeignKeys;
        const tablePath = this.getTablePath(target);
        const table = await this.getCachedTable(tablePath);
        const upQueries: Query[] = [];
        const downQueries: Query[] = [];

        // foreign keys must be dropped before indices, because fk's rely on indices
        if (dropForeignKeys)
            table.foreignKeys.forEach(foreignKey => upQueries.push(this.dropForeignKeySql(table, foreignKey)));

        if (dropIndices) {
            table.indices.forEach(index => {
                upQueries.push(this.dropIndexSql(table, index));
                downQueries.push(this.createIndexSql(table, index));
            });
        }

        upQueries.push(this.dropTableSql(table));
        downQueries.push(this.createTableSql(table, createForeignKeys));

        table.columns
            .filter(column => column.isGenerated && column.generationStrategy === "increment")
            .forEach(column => {
                upQueries.push(new Query(`DROP SEQUENCE ${this.escapePath(this.buildSequencePath(table, column))}`));
                downQueries.push(new Query(`CREATE SEQUENCE ${this.escapePath(this.buildSequencePath(table, column))}`));
            });

        await this.executeQueries(upQueries, downQueries);
    }

    /**
     * Creates a new view.
     */
    async createView(view: View): Promise<void> {
        const upQueries: Query[] = [];
        const downQueries: Query[] = [];
        upQueries.push(this.createViewSql(view));
        upQueries.push(await this.insertViewDefinitionSql(view));
        downQueries.push(this.dropViewSql(view));
        downQueries.push(await this.deleteViewDefinitionSql(view));
        await this.executeQueries(upQueries, downQueries);
    }

    /**
     * Drops the view.
     */
    async dropView(target: View|string): Promise<void> {
        const viewName = target instanceof View ? target.name : target;
        const view = await this.getCachedView(viewName);

        const upQueries: Query[] = [];
        const downQueries: Query[] = [];
        upQueries.push(await this.deleteViewDefinitionSql(view));
        upQueries.push(this.dropViewSql(view));
        downQueries.push(await this.insertViewDefinitionSql(view));
        downQueries.push(this.createViewSql(view));
        await this.executeQueries(upQueries, downQueries);
    }

    /**
     * Renames the given table.
     */
    async renameTable(oldTableOrName: Table|string, newTableName: string): Promise<void> {
        const upQueries: Query[] = [];
        const downQueries: Query[] = [];
        const oldTable = oldTableOrName instanceof Table ? oldTableOrName : await this.getCachedTable(oldTableOrName);
        const newTable = oldTable.clone();

        const { schema: schemaName, tableName: oldTableName } = this.driver.parseTableName(oldTable);

        newTable.name = schemaName ? `${schemaName}.${newTableName}` : newTableName;

        upQueries.push(new Query(`ALTER TABLE ${this.escapePath(oldTable)} RENAME TO "${newTableName}"`));
        downQueries.push(new Query(`ALTER TABLE ${this.escapePath(newTable)} RENAME TO "${oldTableName}"`));

        // rename column primary key constraint
        if (newTable.primaryColumns.length > 0) {
            const columnNames = newTable.primaryColumns.map(column => column.name);

            const oldPkName = this.connection.namingStrategy.primaryKeyName(oldTable, columnNames);
            const newPkName = this.connection.namingStrategy.primaryKeyName(newTable, columnNames);

            upQueries.push(new Query(`ALTER TABLE ${this.escapePath(newTable)} RENAME CONSTRAINT "${oldPkName}" TO "${newPkName}"`));
            downQueries.push(new Query(`ALTER TABLE ${this.escapePath(newTable)} RENAME CONSTRAINT "${newPkName}" TO "${oldPkName}"`));
        }

        // rename unique constraints
        newTable.uniques.forEach(unique => {
            // build new constraint name
            const newUniqueName = this.connection.namingStrategy.uniqueConstraintName(newTable, unique.columnNames);

            // build queries
            upQueries.push(new Query(`ALTER TABLE ${this.escapePath(newTable)} RENAME CONSTRAINT "${unique.name}" TO "${newUniqueName}"`));
            downQueries.push(new Query(`ALTER TABLE ${this.escapePath(newTable)} RENAME CONSTRAINT "${newUniqueName}" TO "${unique.name}"`));

            // replace constraint name
            unique.name = newUniqueName;
        });

        // rename index constraints
        newTable.indices.forEach(index => {
            // build new constraint name
            const { schema } = this.driver.parseTableName(newTable);
            const newIndexName = this.connection.namingStrategy.indexName(newTable, index.columnNames, index.where);

            // build queries
            const up = schema ? `ALTER INDEX "${schema}"."${index.name}" RENAME TO "${newIndexName}"` : `ALTER INDEX "${index.name}" RENAME TO "${newIndexName}"`;
            const down = schema ? `ALTER INDEX "${schema}"."${newIndexName}" RENAME TO "${index.name}"` : `ALTER INDEX "${newIndexName}" RENAME TO "${index.name}"`;
            upQueries.push(new Query(up));
            downQueries.push(new Query(down));

            // replace constraint name
            index.name = newIndexName;
        });

        // rename foreign key constraints
        newTable.foreignKeys.forEach(foreignKey => {
            // build new constraint name
            const newForeignKeyName = this.connection.namingStrategy.foreignKeyName(newTable, foreignKey.columnNames, this.getTablePath(foreignKey), foreignKey.referencedColumnNames);

            // build queries
            upQueries.push(new Query(`ALTER TABLE ${this.escapePath(newTable)} RENAME CONSTRAINT "${foreignKey.name}" TO "${newForeignKeyName}"`));
            downQueries.push(new Query(`ALTER TABLE ${this.escapePath(newTable)} RENAME CONSTRAINT "${newForeignKeyName}" TO "${foreignKey.name}"`));

            // replace constraint name
            foreignKey.name = newForeignKeyName;
        });

        await this.executeQueries(upQueries, downQueries);
    }

    /**
     * Creates a new column from the column in the table.
     */
    async addColumn(tableOrName: Table|string, column: TableColumn): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();
        const upQueries: Query[] = [];
        const downQueries: Query[] = [];

        if (column.generationStrategy === "increment") {
            throw new TypeORMError(`Adding sequential generated columns into existing table is not supported`);
        }

        upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ADD ${this.buildCreateColumnSql(table, column)}`));
        downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} DROP COLUMN "${column.name}"`));

        // create or update primary key constraint
        if (column.isPrimary) {
            const primaryColumns = clonedTable.primaryColumns;
            // if table already have primary key, me must drop it and recreate again
            // todo: altering pk is not supported yet https://github.com/cockroachdb/cockroach/issues/19141
            if (primaryColumns.length > 0) {
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable, primaryColumns.map(column => column.name));
                const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${pkName}"`));
                downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
            }

            primaryColumns.push(column);
            const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable, primaryColumns.map(column => column.name));
            const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
            upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
            downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${pkName}"`));
        }

        // create column index
        const columnIndex = clonedTable.indices.find(index => index.columnNames.length === 1 && index.columnNames[0] === column.name);
        if (columnIndex) {
            // CockroachDB stores unique indices as UNIQUE constraints
            if (columnIndex.isUnique) {
                const unique = new TableUnique({
                    name: this.connection.namingStrategy.uniqueConstraintName(table, columnIndex.columnNames),
                    columnNames: columnIndex.columnNames
                });
                upQueries.push(this.createUniqueConstraintSql(table, unique));
                downQueries.push(this.dropIndexSql(table, unique));
                clonedTable.uniques.push(unique);

            } else {
                upQueries.push(this.createIndexSql(table, columnIndex));
                downQueries.push(this.dropIndexSql(table, columnIndex));
            }
        }

        // create unique constraint
        if (column.isUnique) {
            const uniqueConstraint = new TableUnique({
                name: this.connection.namingStrategy.uniqueConstraintName(table, [column.name]),
                columnNames: [column.name]
            });
            clonedTable.uniques.push(uniqueConstraint);
            upQueries.push(this.createUniqueConstraintSql(table, uniqueConstraint));
            downQueries.push(this.dropIndexSql(table, uniqueConstraint.name!)); // CockroachDB creates indices for unique constraints
        }

        // create column's comment
        if (column.comment) {
            upQueries.push(new Query(`COMMENT ON COLUMN ${this.escapePath(table)}."${column.name}" IS ${this.escapeComment(column.comment)}`));
            downQueries.push(new Query(`COMMENT ON COLUMN ${this.escapePath(table)}."${column.name}" IS ${this.escapeComment(column.comment)}`));
        }

        await this.executeQueries(upQueries, downQueries);

        clonedTable.addColumn(column);
        this.replaceCachedTable(table, clonedTable);
    }

    /**
     * Creates a new columns from the column in the table.
     */
    async addColumns(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        for (const column of columns) {
            await this.addColumn(tableOrName, column);
        }
    }

    /**
     * Renames column in the given table.
     */
    async renameColumn(tableOrName: Table|string, oldTableColumnOrName: TableColumn|string, newTableColumnOrName: TableColumn|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const oldColumn = oldTableColumnOrName instanceof TableColumn ? oldTableColumnOrName : table.columns.find(c => c.name === oldTableColumnOrName);
        if (!oldColumn)
            throw new TypeORMError(`Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`);

        let newColumn;
        if (newTableColumnOrName instanceof TableColumn) {
            newColumn = newTableColumnOrName;
        } else {
            newColumn = oldColumn.clone();
            newColumn.name = newTableColumnOrName;
        }

        return this.changeColumn(table, oldColumn, newColumn);
    }

    /**
     * Changes a column in the table.
     */
    async changeColumn(tableOrName: Table|string, oldTableColumnOrName: TableColumn|string, newColumn: TableColumn): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        let clonedTable = table.clone();
        const upQueries: Query[] = [];
        const downQueries: Query[] = [];

        const oldColumn = oldTableColumnOrName instanceof TableColumn
            ? oldTableColumnOrName
            : table.columns.find(column => column.name === oldTableColumnOrName);
        if (!oldColumn)
            throw new TypeORMError(`Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`);

        if (oldColumn.type !== newColumn.type || oldColumn.length !== newColumn.length) {
            // To avoid data conversion, we just recreate column
            await this.dropColumn(table, oldColumn);
            await this.addColumn(table, newColumn);

            // update cloned table
            clonedTable = table.clone();

        } else {
            if (oldColumn.name !== newColumn.name) {
                // rename column
                upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} RENAME COLUMN "${oldColumn.name}" TO "${newColumn.name}"`));
                downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} RENAME COLUMN "${newColumn.name}" TO "${oldColumn.name}"`));

                // rename column primary key constraint
                if (oldColumn.isPrimary === true) {
                    const primaryColumns = clonedTable.primaryColumns;

                    // build old primary constraint name
                    const columnNames = primaryColumns.map(column => column.name);
                    const oldPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);

                    // replace old column name with new column name
                    columnNames.splice(columnNames.indexOf(oldColumn.name), 1);
                    columnNames.push(newColumn.name);

                    // build new primary constraint name
                    const newPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);

                    upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} RENAME CONSTRAINT "${oldPkName}" TO "${newPkName}"`));
                    downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} RENAME CONSTRAINT "${newPkName}" TO "${oldPkName}"`));
                }

                // rename unique constraints
                clonedTable.findColumnUniques(oldColumn).forEach(unique => {
                    // build new constraint name
                    unique.columnNames.splice(unique.columnNames.indexOf(oldColumn.name), 1);
                    unique.columnNames.push(newColumn.name);
                    const newUniqueName = this.connection.namingStrategy.uniqueConstraintName(clonedTable, unique.columnNames);

                    // build queries
                    upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} RENAME CONSTRAINT "${unique.name}" TO "${newUniqueName}"`));
                    downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} RENAME CONSTRAINT "${newUniqueName}" TO "${unique.name}"`));

                    // replace constraint name
                    unique.name = newUniqueName;
                });

                // rename index constraints
                clonedTable.findColumnIndices(oldColumn).forEach(index => {
                    // build new constraint name
                    index.columnNames.splice(index.columnNames.indexOf(oldColumn.name), 1);
                    index.columnNames.push(newColumn.name);
                    const { schema } = this.driver.parseTableName(table);
                    const newIndexName = this.connection.namingStrategy.indexName(clonedTable, index.columnNames, index.where);

                    // build queries
                    const up = schema ? `ALTER INDEX "${schema}"."${index.name}" RENAME TO "${newIndexName}"` : `ALTER INDEX "${index.name}" RENAME TO "${newIndexName}"`;
                    const down = schema ? `ALTER INDEX "${schema}"."${newIndexName}" RENAME TO "${index.name}"` : `ALTER INDEX "${newIndexName}" RENAME TO "${index.name}"`;
                    upQueries.push(new Query(up));
                    downQueries.push(new Query(down));

                    // replace constraint name
                    index.name = newIndexName;
                });

                // rename foreign key constraints
                clonedTable.findColumnForeignKeys(oldColumn).forEach(foreignKey => {
                    // build new constraint name
                    foreignKey.columnNames.splice(foreignKey.columnNames.indexOf(oldColumn.name), 1);
                    foreignKey.columnNames.push(newColumn.name);
                    const newForeignKeyName = this.connection.namingStrategy.foreignKeyName(clonedTable, foreignKey.columnNames, this.getTablePath(foreignKey), foreignKey.referencedColumnNames);

                    // build queries
                    upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} RENAME CONSTRAINT "${foreignKey.name}" TO "${newForeignKeyName}"`));
                    downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} RENAME CONSTRAINT "${newForeignKeyName}" TO "${foreignKey.name}"`));

                    // replace constraint name
                    foreignKey.name = newForeignKeyName;
                });

                // rename old column in the Table object
                const oldTableColumn = clonedTable.columns.find(column => column.name === oldColumn.name);
                clonedTable.columns[clonedTable.columns.indexOf(oldTableColumn!)].name = newColumn.name;
                oldColumn.name = newColumn.name;
            }

            if (newColumn.precision !== oldColumn.precision || newColumn.scale !== oldColumn.scale) {
                upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${newColumn.name}" TYPE ${this.driver.createFullType(newColumn)}`));
                downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${newColumn.name}" TYPE ${this.driver.createFullType(oldColumn)}`));
            }

            if (oldColumn.isNullable !== newColumn.isNullable) {
                if (newColumn.isNullable) {
                    upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${oldColumn.name}" DROP NOT NULL`));
                    downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${oldColumn.name}" SET NOT NULL`));
                } else {
                    upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${oldColumn.name}" SET NOT NULL`));
                    downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${oldColumn.name}" DROP NOT NULL`));
                }
            }

            if (oldColumn.comment !== newColumn.comment) {
                upQueries.push(new Query(`COMMENT ON COLUMN ${this.escapePath(table)}."${oldColumn.name}" IS ${this.escapeComment(newColumn.comment)}`));
                downQueries.push(new Query(`COMMENT ON COLUMN ${this.escapePath(table)}."${newColumn.name}" IS ${this.escapeComment(oldColumn.comment)}`));
            }

            if (newColumn.isPrimary !== oldColumn.isPrimary) {
                const primaryColumns = clonedTable.primaryColumns;

                // if primary column state changed, we must always drop existed constraint.
                if (primaryColumns.length > 0) {
                    const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable, primaryColumns.map(column => column.name));
                    const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                    upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${pkName}"`));
                    downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                }

                if (newColumn.isPrimary === true) {
                    primaryColumns.push(newColumn);
                    // update column in table
                    const column = clonedTable.columns.find(column => column.name === newColumn.name);
                    column!.isPrimary = true;
                    const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable, primaryColumns.map(column => column.name));
                    const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                    upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                    downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${pkName}"`));

                } else {
                    const primaryColumn = primaryColumns.find(c => c.name === newColumn.name);
                    primaryColumns.splice(primaryColumns.indexOf(primaryColumn!), 1);

                    // update column in table
                    const column = clonedTable.columns.find(column => column.name === newColumn.name);
                    column!.isPrimary = false;

                    // if we have another primary keys, we must recreate constraint.
                    if (primaryColumns.length > 0) {
                        const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable, primaryColumns.map(column => column.name));
                        const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                        upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                        downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${pkName}"`));
                    }
                }
            }

            if (newColumn.isUnique !== oldColumn.isUnique) {
                if (newColumn.isUnique) {
                    const uniqueConstraint = new TableUnique({
                        name: this.connection.namingStrategy.uniqueConstraintName(table, [newColumn.name]),
                        columnNames: [newColumn.name]
                    });
                    clonedTable.uniques.push(uniqueConstraint);
                    upQueries.push(this.createUniqueConstraintSql(table, uniqueConstraint));
                    // CockroachDB creates index for UNIQUE constraint.
                    // We must use DROP INDEX ... CASCADE instead of DROP CONSTRAINT.
                    downQueries.push(this.dropIndexSql(table, uniqueConstraint));

                } else {
                    const uniqueConstraint = clonedTable.uniques.find(unique => {
                        return unique.columnNames.length === 1 && !!unique.columnNames.find(columnName => columnName === newColumn.name);
                    });
                    clonedTable.uniques.splice(clonedTable.uniques.indexOf(uniqueConstraint!), 1);
                    // CockroachDB creates index for UNIQUE constraint.
                    // We must use DROP INDEX ... CASCADE instead of DROP CONSTRAINT.
                    upQueries.push(this.dropIndexSql(table, uniqueConstraint!));
                    downQueries.push(this.createUniqueConstraintSql(table, uniqueConstraint!));
                }
            }

            if (oldColumn.isGenerated !== newColumn.isGenerated && newColumn.generationStrategy !== "uuid") {
                if (newColumn.isGenerated) {
                    if (newColumn.generationStrategy === "increment") {
                        throw new TypeORMError(`Adding sequential generated columns into existing table is not supported`);

                    } else if (newColumn.generationStrategy === "rowid") {
                        upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT unique_rowid()`));
                        downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${newColumn.name}" DROP DEFAULT`));
                    }

                } else {
                    upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${newColumn.name}" DROP DEFAULT`));
                    downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT unique_rowid()`));
                }
            }

            if (newColumn.default !== oldColumn.default) {
                if (newColumn.default !== null && newColumn.default !== undefined) {
                    upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT ${newColumn.default}`));

                    if (oldColumn.default !== null && oldColumn.default !== undefined) {
                        downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT ${oldColumn.default}`));
                    } else {
                        downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${newColumn.name}" DROP DEFAULT`));
                    }

                } else if (oldColumn.default !== null && oldColumn.default !== undefined) {
                    upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${newColumn.name}" DROP DEFAULT`));
                    downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT ${oldColumn.default}`));
                }
            }

        }

        await this.executeQueries(upQueries, downQueries);
        this.replaceCachedTable(table, clonedTable);
    }

    /**
     * Changes a column in the table.
     */
    async changeColumns(tableOrName: Table|string, changedColumns: { newColumn: TableColumn, oldColumn: TableColumn }[]): Promise<void> {
        for (const {oldColumn, newColumn} of changedColumns) {
            await this.changeColumn(tableOrName, oldColumn, newColumn);
        }
    }

    /**
     * Drops column in the table.
     */
    async dropColumn(tableOrName: Table|string, columnOrName: TableColumn|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const column = columnOrName instanceof TableColumn ? columnOrName : table.findColumnByName(columnOrName);
        if (!column)
            throw new TypeORMError(`Column "${columnOrName}" was not found in table "${table.name}"`);

        const clonedTable = table.clone();
        const upQueries: Query[] = [];
        const downQueries: Query[] = [];

        // drop primary key constraint
        // todo: altering pk is not supported yet https://github.com/cockroachdb/cockroach/issues/19141
        if (column.isPrimary) {
            const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable, clonedTable.primaryColumns.map(column => column.name));
            const columnNames = clonedTable.primaryColumns.map(primaryColumn => `"${primaryColumn.name}"`).join(", ");
            upQueries.push(new Query(`ALTER TABLE ${this.escapePath(clonedTable)} DROP CONSTRAINT "${pkName}"`));
            downQueries.push(new Query(`ALTER TABLE ${this.escapePath(clonedTable)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));

            // update column in table
            const tableColumn = clonedTable.findColumnByName(column.name);
            tableColumn!.isPrimary = false;

            // if primary key have multiple columns, we must recreate it without dropped column
            if (clonedTable.primaryColumns.length > 0) {
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable, clonedTable.primaryColumns.map(column => column.name));
                const columnNames = clonedTable.primaryColumns.map(primaryColumn => `"${primaryColumn.name}"`).join(", ");
                upQueries.push(new Query(`ALTER TABLE ${this.escapePath(clonedTable)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                downQueries.push(new Query(`ALTER TABLE ${this.escapePath(clonedTable)} DROP CONSTRAINT "${pkName}"`));
            }
        }

        // drop column index
        const columnIndex = clonedTable.indices.find(index => index.columnNames.length === 1 && index.columnNames[0] === column.name);
        if (columnIndex) {
            clonedTable.indices.splice(clonedTable.indices.indexOf(columnIndex), 1);
            upQueries.push(this.dropIndexSql(table, columnIndex));
            downQueries.push(this.createIndexSql(table, columnIndex));
        }

        // drop column check
        const columnCheck = clonedTable.checks.find(check => !!check.columnNames && check.columnNames.length === 1 && check.columnNames[0] === column.name);
        if (columnCheck) {
            clonedTable.checks.splice(clonedTable.checks.indexOf(columnCheck), 1);
            upQueries.push(this.dropCheckConstraintSql(table, columnCheck));
            downQueries.push(this.createCheckConstraintSql(table, columnCheck));
        }

        // drop column unique
        const columnUnique = clonedTable.uniques.find(unique => unique.columnNames.length === 1 && unique.columnNames[0] === column.name);
        if (columnUnique) {
            clonedTable.uniques.splice(clonedTable.uniques.indexOf(columnUnique), 1);
            upQueries.push(this.dropIndexSql(table, columnUnique.name!)); // CockroachDB creates indices for unique constraints
            downQueries.push(this.createUniqueConstraintSql(table, columnUnique));
        }

        upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} DROP COLUMN "${column.name}"`));
        downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ADD ${this.buildCreateColumnSql(table, column)}`));

        if (column.generationStrategy === "increment") {
            upQueries.push(new Query(`DROP SEQUENCE ${this.escapePath(this.buildSequencePath(table, column))}`));
            downQueries.push(new Query(`CREATE SEQUENCE ${this.escapePath(this.buildSequencePath(table, column))}`));
        }

        await this.executeQueries(upQueries, downQueries);

        clonedTable.removeColumn(column);
        this.replaceCachedTable(table, clonedTable);
    }

    /**
     * Drops the columns in the table.
     */
    async dropColumns(tableOrName: Table|string, columns: TableColumn[]|string[]): Promise<void> {
        for (const column of columns) {
            await this.dropColumn(tableOrName, column);
        }
    }

    /**
     * Creates a new primary key.
     */
    async createPrimaryKey(tableOrName: Table|string, columnNames: string[]): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();

        const up = this.createPrimaryKeySql(table, columnNames);

        // mark columns as primary, because dropPrimaryKeySql build constraint name from table primary column names.
        clonedTable.columns.forEach(column => {
            if (columnNames.find(columnName => columnName === column.name))
                column.isPrimary = true;
        });
        const down = this.dropPrimaryKeySql(clonedTable);

        await this.executeQueries(up, down);
        this.replaceCachedTable(table, clonedTable);
    }

    /**
     * Updates composite primary keys.
     */
    async updatePrimaryKeys(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();
        const columnNames = columns.map(column => column.name);
        const upQueries: Query[] = [];
        const downQueries: Query[] = [];

        // if table already have primary columns, we must drop them.
        const primaryColumns = clonedTable.primaryColumns;
        if (primaryColumns.length > 0) {
            const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable, primaryColumns.map(column => column.name));
            const columnNamesString = primaryColumns.map(column => `"${column.name}"`).join(", ");
            upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${pkName}"`));
            downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNamesString})`));
        }

        // update columns in table.
        clonedTable.columns
            .filter(column => columnNames.indexOf(column.name) !== -1)
            .forEach(column => column.isPrimary = true);

        const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);
        const columnNamesString = columnNames.map(columnName => `"${columnName}"`).join(", ");
        upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNamesString})`));
        downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${pkName}"`));

        await this.executeQueries(upQueries, downQueries);
        this.replaceCachedTable(table, clonedTable);
    }

    /**
     * Drops a primary key.
     */
    async dropPrimaryKey(tableOrName: Table|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const up = this.dropPrimaryKeySql(table);
        const down = this.createPrimaryKeySql(table, table.primaryColumns.map(column => column.name));
        await this.executeQueries(up, down);
        table.primaryColumns.forEach(column => {
            column.isPrimary = false;
        });
    }

    /**
     * Creates new unique constraint.
     */
    async createUniqueConstraint(tableOrName: Table|string, uniqueConstraint: TableUnique): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        // new unique constraint may be passed without name. In this case we generate unique name manually.
        if (!uniqueConstraint.name)
            uniqueConstraint.name = this.connection.namingStrategy.uniqueConstraintName(table, uniqueConstraint.columnNames);

        const up = this.createUniqueConstraintSql(table, uniqueConstraint);
        // CockroachDB creates index for UNIQUE constraint.
        // We must use DROP INDEX ... CASCADE instead of DROP CONSTRAINT.
        const down = this.dropIndexSql(table, uniqueConstraint);
        await this.executeQueries(up, down);
        table.addUniqueConstraint(uniqueConstraint);
    }

    /**
     * Creates new unique constraints.
     */
    async createUniqueConstraints(tableOrName: Table|string, uniqueConstraints: TableUnique[]): Promise<void> {
        for (const uniqueConstraint of uniqueConstraints) {
            await this.createUniqueConstraint(tableOrName, uniqueConstraint);
        }
    }

    /**
     * Drops unique constraint.
     */
    async dropUniqueConstraint(tableOrName: Table|string, uniqueOrName: TableUnique|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const uniqueConstraint = uniqueOrName instanceof TableUnique ? uniqueOrName : table.uniques.find(u => u.name === uniqueOrName);
        if (!uniqueConstraint)
            throw new TypeORMError(`Supplied unique constraint was not found in table ${table.name}`);

        // CockroachDB creates index for UNIQUE constraint.
        // We must use DROP INDEX ... CASCADE instead of DROP CONSTRAINT.
        const up = this.dropIndexSql(table, uniqueConstraint);
        const down = this.createUniqueConstraintSql(table, uniqueConstraint);
        await this.executeQueries(up, down);
        table.removeUniqueConstraint(uniqueConstraint);
    }

    /**
     * Drops unique constraints.
     */
    async dropUniqueConstraints(tableOrName: Table|string, uniqueConstraints: TableUnique[]): Promise<void> {
        for (const uniqueConstraint of uniqueConstraints) {
            await this.dropUniqueConstraint(tableOrName, uniqueConstraint);
        }
    }

    /**
     * Creates new check constraint.
     */
    async createCheckConstraint(tableOrName: Table|string, checkConstraint: TableCheck): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        // new unique constraint may be passed without name. In this case we generate unique name manually.
        if (!checkConstraint.name)
            checkConstraint.name = this.connection.namingStrategy.checkConstraintName(table, checkConstraint.expression!);

        const up = this.createCheckConstraintSql(table, checkConstraint);
        const down = this.dropCheckConstraintSql(table, checkConstraint);
        await this.executeQueries(up, down);
        table.addCheckConstraint(checkConstraint);
    }

    /**
     * Creates new check constraints.
     */
    async createCheckConstraints(tableOrName: Table|string, checkConstraints: TableCheck[]): Promise<void> {
        const promises = checkConstraints.map(checkConstraint => this.createCheckConstraint(tableOrName, checkConstraint));
        await Promise.all(promises);
    }

    /**
     * Drops check constraint.
     */
    async dropCheckConstraint(tableOrName: Table|string, checkOrName: TableCheck|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const checkConstraint = checkOrName instanceof TableCheck ? checkOrName : table.checks.find(c => c.name === checkOrName);
        if (!checkConstraint)
            throw new TypeORMError(`Supplied check constraint was not found in table ${table.name}`);

        const up = this.dropCheckConstraintSql(table, checkConstraint);
        const down = this.createCheckConstraintSql(table, checkConstraint);
        await this.executeQueries(up, down);
        table.removeCheckConstraint(checkConstraint);
    }

    /**
     * Drops check constraints.
     */
    async dropCheckConstraints(tableOrName: Table|string, checkConstraints: TableCheck[]): Promise<void> {
        const promises = checkConstraints.map(checkConstraint => this.dropCheckConstraint(tableOrName, checkConstraint));
        await Promise.all(promises);
    }

    /**
     * Creates new exclusion constraint.
     */
    async createExclusionConstraint(tableOrName: Table|string, exclusionConstraint: TableExclusion): Promise<void> {
        throw new TypeORMError(`CockroachDB does not support exclusion constraints.`);
    }

    /**
     * Creates new exclusion constraints.
     */
    async createExclusionConstraints(tableOrName: Table|string, exclusionConstraints: TableExclusion[]): Promise<void> {
        throw new TypeORMError(`CockroachDB does not support exclusion constraints.`);
    }

    /**
     * Drops exclusion constraint.
     */
    async dropExclusionConstraint(tableOrName: Table|string, exclusionOrName: TableExclusion|string): Promise<void> {
        throw new TypeORMError(`CockroachDB does not support exclusion constraints.`);
    }

    /**
     * Drops exclusion constraints.
     */
    async dropExclusionConstraints(tableOrName: Table|string, exclusionConstraints: TableExclusion[]): Promise<void> {
        throw new TypeORMError(`CockroachDB does not support exclusion constraints.`);
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableOrName: Table|string, foreignKey: TableForeignKey): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        // new FK may be passed without name. In this case we generate FK name manually.
        if (!foreignKey.name)
            foreignKey.name = this.connection.namingStrategy.foreignKeyName(table, foreignKey.columnNames, this.getTablePath(foreignKey), foreignKey.referencedColumnNames);

        const up = this.createForeignKeySql(table, foreignKey);
        const down = this.dropForeignKeySql(table, foreignKey);
        await this.executeQueries(up, down);
        table.addForeignKey(foreignKey);
    }

    /**
     * Creates a new foreign keys.
     */
    async createForeignKeys(tableOrName: Table|string, foreignKeys: TableForeignKey[]): Promise<void> {
        for (const foreignKey of foreignKeys) {
            await this.createForeignKey(tableOrName, foreignKey);
        }
    }

    /**
     * Drops a foreign key from the table.
     */
    async dropForeignKey(tableOrName: Table|string, foreignKeyOrName: TableForeignKey|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const foreignKey = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName : table.foreignKeys.find(fk => fk.name === foreignKeyOrName);
        if (!foreignKey)
            throw new TypeORMError(`Supplied foreign key was not found in table ${table.name}`);

        const up = this.dropForeignKeySql(table, foreignKey);
        const down = this.createForeignKeySql(table, foreignKey);
        await this.executeQueries(up, down);
        table.removeForeignKey(foreignKey);
    }

    /**
     * Drops a foreign keys from the table.
     */
    async dropForeignKeys(tableOrName: Table|string, foreignKeys: TableForeignKey[]): Promise<void> {
        for (const foreignKey of foreignKeys) {
            await this.dropForeignKey(tableOrName, foreignKey);
        }
    }

    /**
     * Creates a new index.
     */
    async createIndex(tableOrName: Table|string, index: TableIndex): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        // new index may be passed without name. In this case we generate index name manually.
        if (!index.name)
            index.name = this.connection.namingStrategy.indexName(table, index.columnNames, index.where);

        // CockroachDB stores unique indices and UNIQUE constraints
        if (index.isUnique) {
            const unique = new TableUnique({
                name: index.name,
                columnNames: index.columnNames
            });
            const up = this.createUniqueConstraintSql(table, unique);
            // CockroachDB also creates index for UNIQUE constraints.
            // We can't drop UNIQUE constraint with DROP CONSTRAINT. We must use DROP INDEX ... CASCADE instead.
            const down = this.dropIndexSql(table, unique);
            await this.executeQueries(up, down);
            table.addUniqueConstraint(unique);

        } else {
            const up = this.createIndexSql(table, index);
            const down = this.dropIndexSql(table, index);
            await this.executeQueries(up, down);
            table.addIndex(index);
        }
    }

    /**
     * Creates a new indices
     */
    async createIndices(tableOrName: Table|string, indices: TableIndex[]): Promise<void> {
        for (const index of indices) {
            await this.createIndex(tableOrName, index);
        }
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(tableOrName: Table|string, indexOrName: TableIndex|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const index = indexOrName instanceof TableIndex ? indexOrName : table.indices.find(i => i.name === indexOrName);
        if (!index)
            throw new TypeORMError(`Supplied index ${indexOrName} was not found in table ${table.name}`);

        const up = this.dropIndexSql(table, index);
        const down = this.createIndexSql(table, index);
        await this.executeQueries(up, down);
        table.removeIndex(index);
    }

    /**
     * Drops an indices from the table.
     */
    async dropIndices(tableOrName: Table|string, indices: TableIndex[]): Promise<void> {
        for (const index of indices) {
            await this.dropIndex(tableOrName, index);
        }
    }

    /**
     * Clears all table contents.
     * Note: this operation uses SQL's TRUNCATE query which cannot be reverted in transactions.
     */
    async clearTable(tableName: string): Promise<void> {
        await this.query(`TRUNCATE TABLE ${this.escapePath(tableName)}`);
    }

    /**
     * Removes all tables from the currently connected database.
     */
    async clearDatabase(): Promise<void> {
        const schemas: string[] = [];
        this.connection.entityMetadatas
            .filter(metadata => metadata.schema)
            .forEach(metadata => {
                const isSchemaExist = !!schemas.find(schema => schema === metadata.schema);
                if (!isSchemaExist)
                    schemas.push(metadata.schema!);
            });
        schemas.push(this.driver.options.schema || "current_schema()");
        const schemaNamesString = schemas.map(name => {
            return name === "current_schema()" ? name : "'" + name + "'";
        }).join(", ");

        const isAnotherTransactionActive = this.isTransactionActive;
        if (!isAnotherTransactionActive)
            await this.startTransaction();
        try {
            const selectViewDropsQuery = `SELECT 'DROP VIEW IF EXISTS "' || schemaname || '"."' || viewname || '" CASCADE;' as "query" ` +
                `FROM "pg_views" WHERE "schemaname" IN (${schemaNamesString})`;
            const dropViewQueries: ObjectLiteral[] = await this.query(selectViewDropsQuery);
            await Promise.all(dropViewQueries.map(q => this.query(q["query"])));

            const selectDropsQuery = `SELECT 'DROP TABLE IF EXISTS "' || table_schema || '"."' || table_name || '" CASCADE;' as "query" FROM "information_schema"."tables" WHERE "table_schema" IN (${schemaNamesString})`;
            const dropQueries: ObjectLiteral[] = await this.query(selectDropsQuery);
            await Promise.all(dropQueries.map(q => this.query(q["query"])));

            const selectSequenceDropsQuery = `SELECT 'DROP SEQUENCE "' || sequence_schema || '"."' || sequence_name || '";' as "query" FROM "information_schema"."sequences" WHERE "sequence_schema" IN (${schemaNamesString})`;
            const sequenceDropQueries: ObjectLiteral[] = await this.query(selectSequenceDropsQuery);
            await Promise.all(sequenceDropQueries.map(q => this.query(q["query"])));

            if (!isAnotherTransactionActive)
                await this.commitTransaction();

        } catch (error) {
            try { // we throw original error even if rollback thrown an error
                if (!isAnotherTransactionActive)
                    await this.rollbackTransaction();
            } catch (rollbackError) { }
            throw error;
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected async loadViews(viewNames?: string[]): Promise<View[]> {
        const hasTable = await this.hasTable(this.getTypeormMetadataTableName());
        if (!hasTable) {
            return [];
        }

        if (!viewNames) {
            viewNames = [];
        }

        const currentDatabase = await this.getCurrentDatabase();
        const currentSchema = await this.getCurrentSchema();

        const viewsCondition = viewNames.map(viewName => {
            const { schema, tableName } = this.driver.parseTableName(viewName);

            return `("t"."schema" = '${schema || currentSchema}' AND "t"."name" = '${tableName}')`;
        }).join(" OR ");

        const query = `SELECT "t".*, "v"."check_option" FROM ${this.escapePath(this.getTypeormMetadataTableName())} "t" ` +
            `INNER JOIN "information_schema"."views" "v" ON "v"."table_schema" = "t"."schema" AND "v"."table_name" = "t"."name" WHERE "t"."type" = '${MetadataTableType.VIEW}' ${viewsCondition ? `AND (${viewsCondition})` : ""}`;
        const dbViews = await this.query(query);
        return dbViews.map((dbView: any) => {
            const view = new View();
            const schema = dbView["schema"] === currentSchema && !this.driver.options.schema ? undefined : dbView["schema"];
            view.database = currentDatabase;
            view.schema = dbView["schema"];
            view.name = this.driver.buildTableName(dbView["name"], schema);
            view.expression = dbView["value"];
            return view;
        });
    }

    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    protected async loadTables(tableNames?: string[]): Promise<Table[]> {

        // if no tables given then no need to proceed
        if (tableNames && tableNames.length === 0) {
            return [];
        }

        const currentSchema = await this.getCurrentSchema();
        const currentDatabase = await this.getCurrentDatabase();

        const dbTables: { table_schema: string, table_name: string }[] = [];

        if (!tableNames) {
            const tablesSql = `SELECT "table_schema", "table_name" FROM "information_schema"."tables"`;

            dbTables.push(...await this.query(tablesSql));
        } else {
            const tablesCondition = tableNames
                .map(tableName => this.driver.parseTableName(tableName))
                .map(({ schema, tableName }) => {
                return `("table_schema" = '${schema || currentSchema}' AND "table_name" = '${tableName}')`;
            }).join(" OR ");
            const tablesSql = `SELECT "table_schema", "table_name" FROM "information_schema"."tables" WHERE ` + tablesCondition;

            dbTables.push(...await this.query(tablesSql));
        }

        if (dbTables.length === 0) {
            return [];
        }

        const columnsCondiiton = dbTables.map(({ table_name, table_schema }) => {
            return `("table_schema" = '${table_schema}' AND "table_name" = '${table_name}')`;
        }).join(" OR ");
        const columnsSql = `
            SELECT
                *,
                pg_catalog.col_description(('"' || table_catalog || '"."' || table_schema || '"."' || table_name || '"')::regclass::oid, ordinal_position) as description
            FROM "information_schema"."columns"
            WHERE "is_hidden" = 'NO' AND ` + columnsCondiiton;

        const constraintsCondition = dbTables.map(({ table_name, table_schema }) => {
            return `("ns"."nspname" = '${table_schema}' AND "t"."relname" = '${table_name}')`;
        }).join(" OR ");

        const constraintsSql = `SELECT "ns"."nspname" AS "table_schema", "t"."relname" AS "table_name", "cnst"."conname" AS "constraint_name", ` +
            `pg_get_constraintdef("cnst"."oid") AS "expression", ` +
            `CASE "cnst"."contype" WHEN 'p' THEN 'PRIMARY' WHEN 'u' THEN 'UNIQUE' WHEN 'c' THEN 'CHECK' WHEN 'x' THEN 'EXCLUDE' END AS "constraint_type", "a"."attname" AS "column_name" ` +
            `FROM "pg_constraint" "cnst" ` +
            `INNER JOIN "pg_class" "t" ON "t"."oid" = "cnst"."conrelid" ` +
            `INNER JOIN "pg_namespace" "ns" ON "ns"."oid" = "cnst"."connamespace" ` +
            `LEFT JOIN "pg_attribute" "a" ON "a"."attrelid" = "cnst"."conrelid" AND "a"."attnum" = ANY ("cnst"."conkey") ` +
            `WHERE "t"."relkind" = 'r' AND (${constraintsCondition})`;

        const indicesSql = `SELECT "ns"."nspname" AS "table_schema", "t"."relname" AS "table_name", "i"."relname" AS "constraint_name", "a"."attname" AS "column_name", ` +
            `CASE "ix"."indisunique" WHEN 't' THEN 'TRUE' ELSE'FALSE' END AS "is_unique", pg_get_expr("ix"."indpred", "ix"."indrelid") AS "condition", ` +
            `"types"."typname" AS "type_name" ` +
            `FROM "pg_class" "t" ` +
            `INNER JOIN "pg_index" "ix" ON "ix"."indrelid" = "t"."oid" ` +
            `INNER JOIN "pg_attribute" "a" ON "a"."attrelid" = "t"."oid"  AND "a"."attnum" = ANY ("ix"."indkey") ` +
            `INNER JOIN "pg_namespace" "ns" ON "ns"."oid" = "t"."relnamespace" ` +
            `INNER JOIN "pg_class" "i" ON "i"."oid" = "ix"."indexrelid" ` +
            `INNER JOIN "pg_type" "types" ON "types"."oid" = "a"."atttypid" ` +
            `LEFT JOIN "pg_constraint" "cnst" ON "cnst"."conname" = "i"."relname" ` +
            `WHERE "t"."relkind" = 'r' AND "cnst"."contype" IS NULL AND (${constraintsCondition})`;

        const foreignKeysCondition = dbTables.map(({ table_name, table_schema }) => {
            return `("ns"."nspname" = '${table_schema}' AND "cl"."relname" = '${table_name}')`;
        }).join(" OR ");
        const foreignKeysSql = `SELECT "con"."conname" AS "constraint_name", "con"."nspname" AS "table_schema", "con"."relname" AS "table_name", "att2"."attname" AS "column_name", ` +
            `"ns"."nspname" AS "referenced_table_schema", "cl"."relname" AS "referenced_table_name", "att"."attname" AS "referenced_column_name", "con"."confdeltype" AS "on_delete", "con"."confupdtype" AS "on_update" ` +
            `FROM ( ` +
            `SELECT UNNEST ("con1"."conkey") AS "parent", UNNEST ("con1"."confkey") AS "child", "con1"."confrelid", "con1"."conrelid", "con1"."conname", "con1"."contype", "ns"."nspname", "cl"."relname", ` +
            `CASE "con1"."confdeltype" WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END as "confdeltype", ` +
            `CASE "con1"."confupdtype" WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END as "confupdtype" ` +
            `FROM "pg_class" "cl" ` +
            `INNER JOIN "pg_namespace" "ns" ON "cl"."relnamespace" = "ns"."oid" ` +
            `INNER JOIN "pg_constraint" "con1" ON "con1"."conrelid" = "cl"."oid" ` +
            `WHERE "con1"."contype" = 'f' AND (${foreignKeysCondition}) ` +
            `) "con" ` +
            `INNER JOIN "pg_attribute" "att" ON "att"."attrelid" = "con"."confrelid" AND "att"."attnum" = "con"."child" ` +
            `INNER JOIN "pg_class" "cl" ON "cl"."oid" = "con"."confrelid" ` +
            `INNER JOIN "pg_namespace" "ns" ON "cl"."relnamespace" = "ns"."oid" ` +
            `INNER JOIN "pg_attribute" "att2" ON "att2"."attrelid" = "con"."conrelid" AND "att2"."attnum" = "con"."parent"`;
        const [dbColumns, dbConstraints, dbIndices, dbForeignKeys]: ObjectLiteral[][] = await Promise.all([
            this.query(columnsSql),
            this.query(constraintsSql),
            this.query(indicesSql),
            this.query(foreignKeysSql),
        ]);

        // create tables for loaded tables
        return Promise.all(dbTables.map(async dbTable => {
            const table = new Table();

            const getSchemaFromKey = (dbObject: any, key: string) => {
                return dbObject[key] === currentSchema && (!this.driver.options.schema || this.driver.options.schema === currentSchema)
                    ? undefined
                    : dbObject[key]
            };

            // We do not need to join schema name, when database is by default.
            const schema = getSchemaFromKey(dbTable, "table_schema");
            table.database = currentDatabase;
            table.schema = dbTable["table_schema"];
            table.name = this.driver.buildTableName(dbTable["table_name"], schema);

            // create columns from the loaded columns
            table.columns = await Promise.all(dbColumns
                .filter(dbColumn => dbColumn["table_name"] === dbTable["table_name"] && dbColumn["table_schema"] === dbTable["table_schema"])
                .map(async dbColumn => {

                    const columnConstraints = dbConstraints.filter(dbConstraint => {
                        return (
                            dbConstraint["table_name"] === dbColumn["table_name"] &&
                            dbConstraint["table_schema"] === dbColumn["table_schema"] &&
                            dbConstraint["column_name"] === dbColumn["column_name"]
                        );
                    });

                    const tableColumn = new TableColumn();
                    tableColumn.name = dbColumn["column_name"];

                    tableColumn.type = dbColumn["crdb_sql_type"].toLowerCase();
                    if (dbColumn["crdb_sql_type"].indexOf("COLLATE") !== -1) {
                        tableColumn.collation = dbColumn["crdb_sql_type"].substr(dbColumn["crdb_sql_type"].indexOf("COLLATE") + "COLLATE".length + 1, dbColumn["crdb_sql_type"].length);
                        tableColumn.type = tableColumn.type.substr(0, dbColumn["crdb_sql_type"].indexOf("COLLATE") - 1);
                    }

                    if (tableColumn.type.indexOf("(") !== -1)
                        tableColumn.type = tableColumn.type.substr(0, tableColumn.type.indexOf("("));

                    if (tableColumn.type === "numeric" || tableColumn.type === "decimal") {
                        if (dbColumn["numeric_precision"] !== null && !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["numeric_precision"])) {
                            tableColumn.precision = parseInt(dbColumn["numeric_precision"]);
                        } else if (dbColumn["numeric_scale"] !== null && !this.isDefaultColumnScale(table, tableColumn, dbColumn["numeric_scale"])) {
                            tableColumn.precision = undefined;
                        }
                        if (dbColumn["numeric_scale"] !== null && !this.isDefaultColumnScale(table, tableColumn, dbColumn["numeric_scale"])) {
                            tableColumn.scale = parseInt(dbColumn["numeric_scale"]);
                        } else if (dbColumn["numeric_precision"] !== null && !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["numeric_precision"])) {
                            tableColumn.scale = undefined;
                        }
                    }

                    if (dbColumn["data_type"].toLowerCase() === "array") {
                        tableColumn.isArray = true;
                        const type = dbColumn["crdb_sql_type"].replace("[]", "").toLowerCase();
                        tableColumn.type = this.connection.driver.normalizeType({type: type});
                    }

                    // check only columns that have length property
                    if (this.driver.withLengthColumnTypes.indexOf(tableColumn.type as ColumnType) !== -1 && dbColumn["character_maximum_length"]) {
                        const length = dbColumn["character_maximum_length"].toString();
                        tableColumn.length = !this.isDefaultColumnLength(table, tableColumn, length) ? length : "";
                    }
                    tableColumn.isNullable = dbColumn["is_nullable"] === "YES";
                    tableColumn.isPrimary = !!columnConstraints.find(constraint => constraint["constraint_type"] === "PRIMARY");

                    const uniqueConstraints = columnConstraints.filter(constraint => constraint["constraint_type"] === "UNIQUE");
                    const isConstraintComposite = uniqueConstraints.every((uniqueConstraint) => {
                        return dbConstraints.some(dbConstraint => dbConstraint["constraint_type"] === "UNIQUE"
                            && dbConstraint["constraint_name"] === uniqueConstraint["constraint_name"]
                            && dbConstraint["column_name"] !== dbColumn["column_name"])
                    })
                    tableColumn.isUnique = uniqueConstraints.length > 0 && !isConstraintComposite;

                    if (dbColumn["column_default"] !== null && dbColumn["column_default"] !== undefined) {
                        if (dbColumn["column_default"] === "unique_rowid()") {
                            tableColumn.isGenerated = true;
                            tableColumn.generationStrategy = "rowid";

                        } else if (dbColumn["column_default"].indexOf("nextval") !== -1) {
                            tableColumn.isGenerated = true;
                            tableColumn.generationStrategy = "increment";

                        } else if (dbColumn["column_default"] === "gen_random_uuid()") {
                            tableColumn.isGenerated = true;
                            tableColumn.generationStrategy = "uuid";

                        } else  {
                            tableColumn.default = dbColumn["column_default"].replace(/:::[\w\s\[\]\"]+/g, "");
                            tableColumn.default = tableColumn.default.replace(/^(-?[\d\.]+)$/, "($1)");
                        }
                    }

                    tableColumn.comment = dbColumn["description"] == null ? undefined : dbColumn["description"];
                    if (dbColumn["character_set_name"])
                        tableColumn.charset = dbColumn["character_set_name"];

                    return tableColumn;
                }));

            // find unique constraints of table, group them by constraint name and build TableUnique.
            const tableUniqueConstraints = OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
                return (
                    dbConstraint["table_name"] === dbTable["table_name"] &&
                    dbConstraint["table_schema"] === dbTable["table_schema"] &&
                    dbConstraint["constraint_type"] === "UNIQUE"
                );
            }), dbConstraint => dbConstraint["constraint_name"]);

            table.uniques = tableUniqueConstraints.map(constraint => {
                const uniques = dbConstraints.filter(dbC => dbC["constraint_name"] === constraint["constraint_name"]);
                return new TableUnique({
                    name: constraint["constraint_name"],
                    columnNames: uniques.map(u => u["column_name"])
                });
            });

            // find check constraints of table, group them by constraint name and build TableCheck.
            const tableCheckConstraints = OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
                return (
                    dbConstraint["table_name"] === dbTable["table_name"] &&
                    dbConstraint["table_schema"] === dbTable["table_schema"] &&
                    dbConstraint["constraint_type"] === "CHECK"
                );
            }), dbConstraint => dbConstraint["constraint_name"]);

            table.checks = tableCheckConstraints.map(constraint => {
                const checks = dbConstraints.filter(dbC => dbC["constraint_name"] === constraint["constraint_name"]);
                return new TableCheck({
                    name: constraint["constraint_name"],
                    columnNames: checks.map(c => c["column_name"]),
                    expression: constraint["expression"].replace(/^\s*CHECK\s*\((.*)\)\s*$/i, "$1")
                });
            });

            // find exclusion constraints of table, group them by constraint name and build TableExclusion.
            const tableExclusionConstraints = OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
                return (
                    dbConstraint["table_name"] === dbTable["table_name"] &&
                    dbConstraint["table_schema"] === dbTable["table_schema"] &&
                    dbConstraint["constraint_type"] === "EXCLUDE"
                );
            }), dbConstraint => dbConstraint["constraint_name"]);

            table.exclusions = tableExclusionConstraints.map(constraint => {
                return new TableExclusion({
                    name: constraint["constraint_name"],
                    expression: constraint["expression"].substring(8) // trim EXCLUDE from start of expression
                });
            });

            // find foreign key constraints of table, group them by constraint name and build TableForeignKey.
            const tableForeignKeyConstraints = OrmUtils.uniq(dbForeignKeys.filter(dbForeignKey => {
                return (
                    dbForeignKey["table_name"] === dbTable["table_name"] &&
                    dbForeignKey["table_schema"] === dbTable["table_schema"]
                );
            }), dbForeignKey => dbForeignKey["constraint_name"]);

            table.foreignKeys = tableForeignKeyConstraints.map(dbForeignKey => {
                const foreignKeys = dbForeignKeys.filter(dbFk => dbFk["constraint_name"] === dbForeignKey["constraint_name"]);

                // if referenced table located in currently used schema, we don't need to concat schema name to table name.
                const schema = getSchemaFromKey(dbForeignKey, "referenced_table_schema");
                const referencedTableName = this.driver.buildTableName(dbForeignKey["referenced_table_name"], schema);

                return new TableForeignKey({
                    name: dbForeignKey["constraint_name"],
                    columnNames: foreignKeys.map(dbFk => dbFk["column_name"]),
                    referencedSchema: dbForeignKey["referenced_table_schema"],
                    referencedTableName: referencedTableName,
                    referencedColumnNames: foreignKeys.map(dbFk => dbFk["referenced_column_name"]),
                    onDelete: dbForeignKey["on_delete"],
                    onUpdate: dbForeignKey["on_update"]
                });
            });

            // find index constraints of table, group them by constraint name and build TableIndex.
            const tableIndexConstraints = OrmUtils.uniq(dbIndices.filter(dbIndex => {
                return (
                    dbIndex["table_name"] === dbTable["table_name"] &&
                    dbIndex["table_schema"] === dbTable["table_schema"]
                );
            }), dbIndex => dbIndex["constraint_name"]);

            table.indices = tableIndexConstraints.map(constraint => {
                const indices = dbIndices.filter(index => index["constraint_name"] === constraint["constraint_name"]);
                return new TableIndex(<TableIndexOptions>{
                    table: table,
                    name: constraint["constraint_name"],
                    columnNames: indices.map(i => i["column_name"]),
                    isUnique: constraint["is_unique"] === "TRUE",
                    where: constraint["condition"],
                    isSpatial: indices.every(i => this.driver.spatialTypes.indexOf(i["type_name"]) >= 0),
                    isFulltext: false
                });
            });

            return table;
        }));
    }

    /**
     * Builds create table sql.
     */
    protected createTableSql(table: Table, createForeignKeys?: boolean): Query {
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(table, column)).join(", ");
        let sql = `CREATE TABLE ${this.escapePath(table)} (${columnDefinitions}`;

        table.columns
            .filter(column => column.isUnique)
            .forEach(column => {
                const isUniqueExist = table.uniques.some(unique => unique.columnNames.length === 1 && unique.columnNames[0] === column.name);
                if (!isUniqueExist)
                    table.uniques.push(new TableUnique({
                        name: this.connection.namingStrategy.uniqueConstraintName(table, [column.name]),
                        columnNames: [column.name]
                    }));
            });

        table.indices
            .filter(index => index.isUnique)
            .forEach(index => {
                table.uniques.push(new TableUnique({
                    name: this.connection.namingStrategy.uniqueConstraintName(table, index.columnNames),
                    columnNames: index.columnNames
                }));
            });

        if (table.uniques.length > 0) {
            const uniquesSql = table.uniques.map(unique => {
                const uniqueName = unique.name ? unique.name : this.connection.namingStrategy.uniqueConstraintName(table, unique.columnNames);
                const columnNames = unique.columnNames.map(columnName => `"${columnName}"`).join(", ");
                return `CONSTRAINT "${uniqueName}" UNIQUE (${columnNames})`;
            }).join(", ");

            sql += `, ${uniquesSql}`;
        }

        if (table.checks.length > 0) {
            const checksSql = table.checks.map(check => {
                const checkName = check.name ? check.name : this.connection.namingStrategy.checkConstraintName(table, check.expression!);
                return `CONSTRAINT "${checkName}" CHECK (${check.expression})`;
            }).join(", ");

            sql += `, ${checksSql}`;
        }

        if (table.foreignKeys.length > 0 && createForeignKeys) {
            const foreignKeysSql = table.foreignKeys.map(fk => {
                const columnNames = fk.columnNames.map(columnName => `"${columnName}"`).join(", ");
                if (!fk.name)
                    fk.name = this.connection.namingStrategy.foreignKeyName(table, fk.columnNames, this.getTablePath(fk), fk.referencedColumnNames);
                const referencedColumnNames = fk.referencedColumnNames.map(columnName => `"${columnName}"`).join(", ");

                let constraint = `CONSTRAINT "${fk.name}" FOREIGN KEY (${columnNames}) REFERENCES ${this.escapePath(this.getTablePath(fk))} (${referencedColumnNames})`;
                if (fk.onDelete)
                    constraint += ` ON DELETE ${fk.onDelete}`;
                if (fk.onUpdate)
                    constraint += ` ON UPDATE ${fk.onUpdate}`;

                return constraint;
            }).join(", ");

            sql += `, ${foreignKeysSql}`;
        }

        const primaryColumns = table.columns.filter(column => column.isPrimary);
        if (primaryColumns.length > 0) {
            const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table, primaryColumns.map(column => column.name));
            const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
            sql += `, CONSTRAINT "${primaryKeyName}" PRIMARY KEY (${columnNames})`;
        }

        sql += `)`;

        table.columns
            .filter(it => it.comment)
            .forEach(it => sql += `; COMMENT ON COLUMN ${this.escapePath(table)}."${it.name}" IS ${this.escapeComment(it.comment)}`);


        return new Query(sql);
    }

    /**
     * Builds drop table sql.
     */
    protected dropTableSql(tableOrPath: Table|string): Query {
        return new Query(`DROP TABLE ${this.escapePath(tableOrPath)}`);
    }

    protected createViewSql(view: View): Query {
        if (typeof view.expression === "string") {
            return new Query(`CREATE VIEW ${this.escapePath(view)} AS ${view.expression}`);
        } else {
            return new Query(`CREATE VIEW ${this.escapePath(view)} AS ${view.expression(this.connection).getQuery()}`);
        }
    }

    protected async insertViewDefinitionSql(view: View): Promise<Query> {
        const currentSchema = await this.getCurrentSchema();

        let { schema, tableName: name } = this.driver.parseTableName(view)

        if (!schema) {
            schema = currentSchema;
        }

        const expression = typeof view.expression === "string" ? view.expression.trim() : view.expression(this.connection).getQuery();
        return this.insertTypeormMetadataSql({
            type: MetadataTableType.VIEW,
            schema: schema,
            name: name,
            value: expression
        });
    }

    /**
     * Builds drop view sql.
     */
    protected dropViewSql(viewOrPath: View|string): Query {
        return new Query(`DROP VIEW ${this.escapePath(viewOrPath)}`);
    }

    /**
     * Builds remove view sql.
     */
    protected async deleteViewDefinitionSql(viewOrPath: View|string): Promise<Query> {
        const currentSchema = await this.getCurrentSchema();

        let { schema, tableName: name } = this.driver.parseTableName(viewOrPath);

        if (!schema) {
            schema = currentSchema;
        }

        return this.deleteTypeormMetadataSql({ type: MetadataTableType.VIEW, schema, name });
    }

    /**
     * Builds create index sql.
     * UNIQUE indices creates as UNIQUE constraints.
     */
    protected createIndexSql(table: Table, index: TableIndex): Query {
        const columns = index.columnNames.map(columnName => `"${columnName}"`).join(", ");
        return new Query(`CREATE INDEX "${index.name}" ON ${this.escapePath(table)} (${columns}) ${index.where ? "WHERE " + index.where : ""}`);
    }

    /**
     * Builds drop index sql.
     */
    protected dropIndexSql(table: Table, indexOrName: TableIndex|TableUnique|string): Query {
        let indexName = (indexOrName instanceof TableIndex || indexOrName instanceof TableUnique) ? indexOrName.name : indexOrName;
        return new Query(`DROP INDEX ${this.escapePath(table)}@"${indexName}" CASCADE`);
    }

    /**
     * Builds create primary key sql.
     */
    protected createPrimaryKeySql(table: Table, columnNames: string[]): Query {
        const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table, columnNames);
        const columnNamesString = columnNames.map(columnName => `"${columnName}"`).join(", ");
        return new Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${primaryKeyName}" PRIMARY KEY (${columnNamesString})`);
    }

    /**
     * Builds drop primary key sql.
     */
    protected dropPrimaryKeySql(table: Table): Query {
        const columnNames = table.primaryColumns.map(column => column.name);
        const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table, columnNames);
        return new Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${primaryKeyName}"`);
    }

    /**
     * Builds create unique constraint sql.
     */
    protected createUniqueConstraintSql(table: Table, uniqueConstraint: TableUnique|TableIndex): Query {
        const columnNames = uniqueConstraint.columnNames.map(column => `"` + column + `"`).join(", ");
        return new Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE (${columnNames})`);
    }

    /**
     * Builds drop unique constraint sql.
     */
    protected dropUniqueConstraintSql(table: Table, uniqueOrName: TableUnique|string): Query {
        const uniqueName = uniqueOrName instanceof TableUnique ? uniqueOrName.name : uniqueOrName;
        return new Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${uniqueName}"`);
    }

    /**
     * Builds create check constraint sql.
     */
    protected createCheckConstraintSql(table: Table, checkConstraint: TableCheck): Query {
        return new Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${checkConstraint.name}" CHECK (${checkConstraint.expression})`);
    }

    /**
     * Builds drop check constraint sql.
     */
    protected dropCheckConstraintSql(table: Table, checkOrName: TableCheck|string): Query {
        const checkName = checkOrName instanceof TableCheck ? checkOrName.name : checkOrName;
        return new Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${checkName}"`);
    }

    /**
     * Builds create foreign key sql.
     */
    protected createForeignKeySql(table: Table, foreignKey: TableForeignKey): Query {
        const columnNames = foreignKey.columnNames.map(column => `"` + column + `"`).join(", ");
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `"` + column + `"`).join(",");
        let sql = `ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${foreignKey.name}" FOREIGN KEY (${columnNames}) ` +
            `REFERENCES ${this.escapePath(this.getTablePath(foreignKey))}(${referencedColumnNames})`;
        if (foreignKey.onDelete)
            sql += ` ON DELETE ${foreignKey.onDelete}`;
        if (foreignKey.onUpdate)
            sql += ` ON UPDATE ${foreignKey.onUpdate}`;

        return new Query(sql);
    }

    /**
     * Builds drop foreign key sql.
     */
    protected dropForeignKeySql(table: Table, foreignKeyOrName: TableForeignKey|string): Query {
        const foreignKeyName = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName.name : foreignKeyOrName;
        return new Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${foreignKeyName}"`);
    }

    /**
     * Builds sequence name from given table and column.
     */
    protected buildSequenceName(table: Table, columnOrName: TableColumn|string): string {
        const { tableName } = this.driver.parseTableName(table);

        const columnName = columnOrName instanceof TableColumn ? columnOrName.name : columnOrName;

        return `${tableName}_${columnName}_seq`;
    }

    protected buildSequencePath(table: Table, columnOrName: TableColumn|string): string {
        const { schema } = this.driver.parseTableName(table);

        return schema ? `${schema}.${this.buildSequenceName(table, columnOrName)}` : this.buildSequenceName(table, columnOrName);
    }

    /**
     * Escapes a given comment so it's safe to include in a query.
     */
    protected escapeComment(comment?: string) {
        if (comment === undefined || comment.length === 0) {
            return 'NULL';
        }

        comment = comment
            .replace(/'/g, "''")
            .replace(/\u0000/g, ""); // Null bytes aren't allowed in comments

        return `'${comment}'`;
    }

    /**
     * Escapes given table or view path.
     */
    protected escapePath(target: Table|View|string): string {
        const { schema, tableName } = this.driver.parseTableName(target);

        if (schema && schema !== this.driver.searchSchema) {
            return `"${schema}"."${tableName}"`;
        }

        return `"${tableName}"`;
    }

    /**
     * Builds a query for create column.
     */
    protected buildCreateColumnSql(table: Table, column: TableColumn) {
        let c = "\"" + column.name + "\"";

        if (column.isGenerated) {
            if (column.generationStrategy === "increment") {
                c += ` INT DEFAULT nextval('${this.escapePath(this.buildSequencePath(table, column))}')`;

            } else if (column.generationStrategy === "rowid") {
                c += " INT DEFAULT unique_rowid()";

            } else if (column.generationStrategy === "uuid") {
                c += " UUID DEFAULT gen_random_uuid()";
            }
        }
        if (!column.isGenerated)
            c += " " + this.connection.driver.createFullType(column);
        if (column.charset)
            c += " CHARACTER SET \"" + column.charset + "\"";
        if (column.collation)
            c += " COLLATE \"" + column.collation + "\"";
        if (!column.isNullable)
            c += " NOT NULL";
        if (!column.isGenerated && column.default !== undefined && column.default !== null)
            c += " DEFAULT " + column.default;

        return c;
    }

}
