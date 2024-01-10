import {Driver} from "../Driver";
import {ConnectionIsNotSetError} from "../../error/ConnectionIsNotSetError";
import {DriverPackageNotInstalledError} from "../../error/DriverPackageNotInstalledError";
import {OracleQueryRunner} from "./OracleQueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {DateUtils} from "../../util/DateUtils";
import {PlatformTools} from "../../platform/PlatformTools";
import {Connection} from "../../connection/Connection";
import {RdbmsSchemaBuilder} from "../../schema-builder/RdbmsSchemaBuilder";
import {OracleConnectionOptions} from "./OracleConnectionOptions";
import {MappedColumnTypes} from "../types/MappedColumnTypes";
import {ColumnType} from "../types/ColumnTypes";
import {DataTypeDefaults} from "../types/DataTypeDefaults";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {OracleConnectionCredentialsOptions} from "./OracleConnectionCredentialsOptions";
import {DriverUtils} from "../DriverUtils";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {OrmUtils} from "../../util/OrmUtils";
import {ApplyValueTransformers} from "../../util/ApplyValueTransformers";
import {ReplicationMode} from "../types/ReplicationMode";
import { Table } from "../../schema-builder/table/Table";
import { View } from "../../schema-builder/view/View";
import { TableForeignKey } from "../../schema-builder/table/TableForeignKey";
import { TypeORMError } from "../../error";

/**
 * Organizes communication with Oracle RDBMS.
 */
export class OracleDriver implements Driver {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Connection used by driver.
     */
    connection: Connection;

    /**
     * Underlying oracle library.
     */
    oracle: any;

    /**
     * Pool for master database.
     */
    master: any;

    /**
     * Pool for slave databases.
     * Used in replication.
     */
    slaves: any[] = [];

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Connection options.
     */
    options: OracleConnectionOptions;

    /**
     * Database name used to perform all write queries.
     */
    database?: string;

    /**
     * Schema name used to perform all write queries.
     */
    schema?: string;

    /**
     * Indicates if replication is enabled.
     */
    isReplicated: boolean = false;

    /**
     * Indicates if tree tables are supported by this driver.
     */
    treeSupport = true;

    /**
     * Represent transaction support by this driver
     */
    transactionSupport = "nested" as const;

    /**
     * Gets list of supported column data types by a driver.
     *
     * @see https://www.techonthenet.com/oracle/datatypes.php
     * @see https://docs.oracle.com/cd/B28359_01/server.111/b28318/datatype.htm#CNCPT012
     */
    supportedDataTypes: ColumnType[] = [
        "char",
        "nchar",
        "nvarchar2",
        "varchar2",
        "long",
        "raw",
        "long raw",
        "number",
        "numeric",
        "float",
        "dec",
        "decimal",
        "integer",
        "int",
        "smallint",
        "real",
        "double precision",
        "date",
        "timestamp",
        "timestamp with time zone",
        "timestamp with local time zone",
        "interval year to month",
        "interval day to second",
        "bfile",
        "blob",
        "clob",
        "nclob",
        "rowid",
        "urowid"
    ];

    /**
     * Gets list of spatial column data types.
     */
    spatialTypes: ColumnType[] = [];

    /**
     * Gets list of column data types that support length by a driver.
     */
    withLengthColumnTypes: ColumnType[] = [
        "char",
        "nchar",
        "nvarchar2",
        "varchar2",
        "varchar",
        "raw"
    ];

    /**
     * Gets list of column data types that support precision by a driver.
     */
    withPrecisionColumnTypes: ColumnType[] = [
        "number",
        "float",
        "timestamp",
        "timestamp with time zone",
        "timestamp with local time zone"
    ];

    /**
     * Gets list of column data types that support scale by a driver.
     */
    withScaleColumnTypes: ColumnType[] = [
        "number"
    ];

    /**
     * Orm has special columns and we need to know what database column types should be for those types.
     * Column types are driver dependant.
     */
    mappedDataTypes: MappedColumnTypes = {
        createDate: "timestamp",
        createDateDefault: "CURRENT_TIMESTAMP",
        updateDate: "timestamp",
        updateDateDefault: "CURRENT_TIMESTAMP",
        deleteDate: "timestamp",
        deleteDateNullable: true,
        version: "number",
        treeLevel: "number",
        migrationId: "number",
        migrationName: "varchar2",
        migrationTimestamp: "number",
        cacheId: "number",
        cacheIdentifier: "varchar2",
        cacheTime: "number",
        cacheDuration: "number",
        cacheQuery: "clob",
        cacheResult: "clob",
        metadataType: "varchar2",
        metadataDatabase: "varchar2",
        metadataSchema: "varchar2",
        metadataTable: "varchar2",
        metadataName: "varchar2",
        metadataValue: "clob",
    };

    /**
     * Default values of length, precision and scale depends on column data type.
     * Used in the cases when length/precision/scale is not specified by user.
     */
    dataTypeDefaults: DataTypeDefaults = {
        "char": { length: 1 },
        "nchar": { length: 1 },
        "varchar": { length: 255 },
        "varchar2": { length: 255 },
        "nvarchar2": { length: 255 },
        "raw": { length: 2000 },
        "float": { precision: 126 },
        "timestamp": { precision: 6 },
        "timestamp with time zone": { precision: 6 },
        "timestamp with local time zone": { precision: 6 }
    };

    /**
     * Max length allowed by Oracle for aliases.
     * @see https://docs.oracle.com/database/121/SQLRF/sql_elements008.htm#SQLRF51129
     * > The following list of rules applies to both quoted and nonquoted identifiers unless otherwise indicated
     * > Names must be from 1 to 30 bytes long with these exceptions:
     * > [...]
     *
     * Since Oracle 12.2 (with a compatible driver/client), the limit has been set to 128.
     * @see https://docs.oracle.com/en/database/oracle/oracle-database/12.2/sqlrf/Database-Object-Names-and-Qualifiers.html
     *
     * > If COMPATIBLE is set to a value of 12.2 or higher, then names must be from 1 to 128 bytes long with these exceptions
     */
    maxAliasLength = 30;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        this.connection = connection;
        this.options = connection.options as OracleConnectionOptions;

        if (this.options.useUTC === true) {
            process.env.ORA_SDTZ = "UTC";
        }
        // load oracle package
        this.loadDependencies();

        this.database = DriverUtils.buildDriverOptions(this.options.replication ? this.options.replication.master : this.options).database;
        this.schema = DriverUtils.buildDriverOptions(this.options).schema;

        // Object.assign(connection.options, DriverUtils.buildDriverOptions(connection.options)); // todo: do it better way
        // validate options to make sure everything is set
        // if (!this.options.host)
        //     throw new DriverOptionNotSetError("host");
        // if (!this.options.username)
        //     throw new DriverOptionNotSetError("username");
        // if (!this.options.sid)
        //     throw new DriverOptionNotSetError("sid");
        //
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     * Based on pooling options, it can either create connection immediately,
     * either create a pool and create connection when needed.
     */
    async connect(): Promise<void> {
        this.oracle.fetchAsString = [ this.oracle.CLOB ];
        this.oracle.fetchAsBuffer = [ this.oracle.BLOB ];
        if (this.options.replication) {
            this.slaves = await Promise.all(this.options.replication.slaves.map(slave => {
                return this.createPool(this.options, slave);
            }));
            this.master = await this.createPool(this.options, this.options.replication.master);
        } else {
            this.master = await this.createPool(this.options, this.options);
        }

        if (!this.database || !this.schema) {
            const queryRunner = await this.createQueryRunner("master");

            if (!this.database) {
                this.database = await queryRunner.getCurrentDatabase();
            }

            if (!this.schema) {
                this.schema = await queryRunner.getCurrentSchema();
            }

            await queryRunner.release();
        }
    }

    /**
     * Makes any action after connection (e.g. create extensions in Postgres driver).
     */
    afterConnect(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Closes connection with the database.
     */
    async disconnect(): Promise<void> {
        if (!this.master)
            return Promise.reject(new ConnectionIsNotSetError("oracle"));

        await this.closePool(this.master);
        await Promise.all(this.slaves.map(slave => this.closePool(slave)));
        this.master = undefined;
        this.slaves = [];
    }

    /**
     * Creates a schema builder used to build and sync a schema.
     */
    createSchemaBuilder() {
        return new RdbmsSchemaBuilder(this.connection);
    }

    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode: ReplicationMode) {
        return new OracleQueryRunner(this, mode);
    }

    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral, nativeParameters: ObjectLiteral): [string, any[]] {
        const escapedParameters: any[] = Object.keys(nativeParameters).map(key => {
            if (typeof nativeParameters[key] === "boolean")
                return nativeParameters[key] ? 1 : 0;
            return nativeParameters[key];
        });
        if (!parameters || !Object.keys(parameters).length)
            return [sql, escapedParameters];

        sql = sql.replace(/:(\.\.\.)?([A-Za-z0-9_.]+)/g, (full, isArray: string, key: string): string => {
            if (!parameters.hasOwnProperty(key)) {
                return full;
            }

            let value: any = parameters[key];

            if (isArray) {
                return value.map((v: any) => {
                    escapedParameters.push(v);
                    return this.createParameter(key, escapedParameters.length - 1);
                }).join(", ");

            }

            if (value instanceof Function) {
                return value();

            }

            if (typeof value === "boolean") {
                return value ? "1" : "0";
            }

            escapedParameters.push(value);
            return this.createParameter(key, escapedParameters.length - 1);
        }); // todo: make replace only in value statements, otherwise problems
        return [sql, escapedParameters];
    }

    /**
     * Escapes a column name.
     */
    escape(columnName: string): string {
        return `"${columnName}"`;
    }

    /**
     * Build full table name with database name, schema name and table name.
     * Oracle does not support table schemas. One user can have only one schema.
     */
    buildTableName(tableName: string, schema?: string, database?: string): string {
        let tablePath = [ tableName ];

        if (schema) {
            tablePath.unshift(schema);
        }

        return tablePath.join(".");
    }

    /**
     * Parse a target table name or other types and return a normalized table definition.
     */
    parseTableName(target: EntityMetadata | Table | View | TableForeignKey | string): { database?: string, schema?: string, tableName: string } {
        const driverDatabase = this.database;
        const driverSchema = this.schema;

        if (target instanceof Table || target instanceof View) {
            const parsed = this.parseTableName(target.name);

            return {
                database: target.database || parsed.database || driverDatabase,
                schema: target.schema || parsed.schema || driverSchema,
                tableName: parsed.tableName
            };
        }

        if (target instanceof TableForeignKey) {
            const parsed = this.parseTableName(target.referencedTableName);

            return {
                database: target.referencedDatabase || parsed.database || driverDatabase,
                schema: target.referencedSchema || parsed.schema || driverSchema,
                tableName: parsed.tableName
            };
        }

        if (target instanceof EntityMetadata) {
            // EntityMetadata tableName is never a path

            return {
                database: target.database || driverDatabase,
                schema: target.schema || driverSchema,
                tableName: target.tableName
            };

        }

        const parts = target.split(".");

        if (parts.length === 3) {
            return {
                database: parts[0] || driverDatabase,
                schema: parts[1] || driverSchema,
                tableName: parts[2]
            };
        } else if (parts.length === 2) {
            return {
                database: driverDatabase,
                schema: parts[0] || driverSchema,
                tableName: parts[1]
            };
        } else {
            return {
                database: driverDatabase,
                schema: driverSchema,
                tableName: target
            };
        }
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformTo(columnMetadata.transformer, value);

        if (value === null || value === undefined)
            return value;

        if (columnMetadata.type === Boolean) {
            return value ? 1 : 0;

        } else if (columnMetadata.type === "date") {
            if (typeof value === "string")
                value = value.replace(/[^0-9-]/g, "");
            return () => `TO_DATE('${DateUtils.mixedDateToDateString(value)}', 'YYYY-MM-DD')`;

        } else if (columnMetadata.type === Date
            || columnMetadata.type === "timestamp"
            || columnMetadata.type === "timestamp with time zone"
            || columnMetadata.type === "timestamp with local time zone") {
            return DateUtils.mixedDateToDate(value);

        } else if (columnMetadata.type === "simple-array") {
            return DateUtils.simpleArrayToString(value);

        } else if (columnMetadata.type === "simple-json") {
            return DateUtils.simpleJsonToString(value);
        }

        return value;
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
        if (value === null || value === undefined)
            return columnMetadata.transformer ? ApplyValueTransformers.transformFrom(columnMetadata.transformer, value) : value;

        if (columnMetadata.type === Boolean) {
            value = !!value;

        } else if (columnMetadata.type === "date") {
            value = DateUtils.mixedDateToDateString(value);

        } else if (columnMetadata.type === "time") {
            value = DateUtils.mixedTimeToString(value);

        } else if (columnMetadata.type === Date
            || columnMetadata.type === "timestamp"
            || columnMetadata.type === "timestamp with time zone"
            || columnMetadata.type === "timestamp with local time zone") {
            value = DateUtils.normalizeHydratedDate(value);

        } else if (columnMetadata.type === "json") {
            value = JSON.parse(value);

        } else if (columnMetadata.type === "simple-array") {
            value = DateUtils.stringToSimpleArray(value);

        } else if (columnMetadata.type === "simple-json") {
            value = DateUtils.stringToSimpleJson(value);
        }

        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformFrom(columnMetadata.transformer, value);

        return value;
    }

    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column: { type?: ColumnType, length?: number|string, precision?: number|null, scale?: number, isArray?: boolean }): string {
        if (column.type === Number || column.type === Boolean || column.type === "numeric"
            || column.type === "dec" || column.type === "decimal" || column.type === "int"
            || column.type === "integer" || column.type === "smallint") {
            return "number";

        } else if (column.type === "real" || column.type === "double precision") {
            return "float";

        } else if (column.type === String || column.type === "varchar") {
            return "varchar2";

        } else if (column.type === Date) {
            return "timestamp";

        } else if ((column.type as any) === Buffer) {
            return "blob";

        } else if (column.type === "uuid") {
            return "varchar2";

        } else if (column.type === "simple-array") {
            return "clob";

        } else if (column.type === "simple-json") {
            return "clob";

        } else {
            return column.type as string || "";
        }
    }

    /**
     * Normalizes "default" value of the column.
     */
    normalizeDefault(columnMetadata: ColumnMetadata): string | undefined {
        const defaultValue = columnMetadata.default;

        if (typeof defaultValue === "number") {
            return "" + defaultValue;
        }

        if (typeof defaultValue === "boolean") {
            return defaultValue ? "1" : "0";
        }

        if (typeof defaultValue === "function") {
            return defaultValue();
        }

        if (typeof defaultValue === "string") {
            return `'${defaultValue}'`;
        }

        if (defaultValue === null || defaultValue === undefined) {
            return undefined;
        }

        return `${defaultValue}`;
    }

    /**
     * Normalizes "isUnique" value of the column.
     */
    normalizeIsUnique(column: ColumnMetadata): boolean {
        return column.entityMetadata.uniques.some(uq => uq.columns.length === 1 && uq.columns[0] === column);
    }

    /**
     * Calculates column length taking into account the default length values.
     */
    getColumnLength(column: ColumnMetadata|TableColumn): string {
        if (column.length)
            return column.length.toString();

        switch (column.type) {
            case String:
            case "varchar":
            case "varchar2":
            case "nvarchar2":
                return "255";
            case "raw":
                return "2000";
            case "uuid":
                return "36";
            default:
                return "";
        }
    }

    createFullType(column: TableColumn): string {
        let type = column.type;

        // used 'getColumnLength()' method, because in Oracle column length is required for some data types.
        if (this.getColumnLength(column)) {
            type += `(${this.getColumnLength(column)})`;

        } else if (column.precision !== null && column.precision !== undefined && column.scale !== null && column.scale !== undefined) {
            type += "(" + column.precision + "," + column.scale + ")";

        } else if (column.precision !== null && column.precision !== undefined) {
            type += "(" + column.precision + ")";
        }

        if (column.type === "timestamp with time zone") {
            type = "TIMESTAMP" + (column.precision !== null && column.precision !== undefined ? "(" + column.precision + ")" : "") + " WITH TIME ZONE";

        } else if (column.type === "timestamp with local time zone") {
            type = "TIMESTAMP" + (column.precision !== null && column.precision !== undefined ? "(" + column.precision + ")" : "") + " WITH LOCAL TIME ZONE";
        }

        if (column.isArray)
            type += " array";

        return type;
    }

    /**
     * Obtains a new database connection to a master server.
     * Used for replication.
     * If replication is not setup then returns default connection's database connection.
     */
    obtainMasterConnection(): Promise<any> {
        return new Promise<any>((ok, fail) => {
            if (!this.master) {
                return fail(new TypeORMError("Driver not Connected"));
            }

            this.master.getConnection((err: any, connection: any, release: Function) => {
                if (err) return fail(err);
                ok(connection);
            });
        });
    }

    /**
     * Obtains a new database connection to a slave server.
     * Used for replication.
     * If replication is not setup then returns master (default) connection's database connection.
     */
    obtainSlaveConnection(): Promise<any> {
        if (!this.slaves.length)
            return this.obtainMasterConnection();

        return new Promise<any>((ok, fail) => {
            const random = Math.floor(Math.random() * this.slaves.length);

            this.slaves[random].getConnection((err: any, connection: any) => {
                if (err) return fail(err);
                ok(connection);
            });
        });
    }

    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     */
    createGeneratedMap(metadata: EntityMetadata, insertResult: ObjectLiteral) {
        if (!insertResult)
            return undefined;

        return Object.keys(insertResult).reduce((map, key) => {
            const column = metadata.findColumnWithDatabaseName(key);
            if (column) {
                OrmUtils.mergeDeep(map, column.createValueMap(this.prepareHydratedValue(insertResult[key], column)));
            }
            return map;
        }, {} as ObjectLiteral);
    }

    /**
     * Differentiate columns of this table and columns from the given column metadatas columns
     * and returns only changed.
     */
    findChangedColumns(tableColumns: TableColumn[], columnMetadatas: ColumnMetadata[]): ColumnMetadata[] {
        return columnMetadatas.filter(columnMetadata => {
            const tableColumn = tableColumns.find(c => c.name === columnMetadata.databaseName);
            if (!tableColumn)
                return false; // we don't need new columns, we only need exist and changed

            const isColumnChanged = tableColumn.name !== columnMetadata.databaseName
                || tableColumn.type !== this.normalizeType(columnMetadata)
                || tableColumn.length !== this.getColumnLength(columnMetadata)
                || tableColumn.precision !== columnMetadata.precision
                || tableColumn.scale !== columnMetadata.scale
                // || tableColumn.comment !== columnMetadata.comment
                || tableColumn.default !== this.normalizeDefault(columnMetadata)
                || tableColumn.isPrimary !== columnMetadata.isPrimary
                || tableColumn.isNullable !== columnMetadata.isNullable
                || tableColumn.isUnique !== this.normalizeIsUnique(columnMetadata)
                || (columnMetadata.generationStrategy !== "uuid" && tableColumn.isGenerated !== columnMetadata.isGenerated);

            // DEBUG SECTION
            // if (isColumnChanged) {
            //     console.log("table:", columnMetadata.entityMetadata.tableName);
            //     console.log("name:", tableColumn.name, columnMetadata.databaseName);
            //     console.log("type:", tableColumn.type, this.normalizeType(columnMetadata));
            //     console.log("length:", tableColumn.length, columnMetadata.length);
            //     console.log("precision:", tableColumn.precision, columnMetadata.precision);
            //     console.log("scale:", tableColumn.scale, columnMetadata.scale);
            //     console.log("comment:", tableColumn.comment, columnMetadata.comment);
            //     console.log("default:", tableColumn.default, this.normalizeDefault(columnMetadata));
            //     console.log("enum:", tableColumn.enum && columnMetadata.enum && !OrmUtils.isArraysEqual(tableColumn.enum, columnMetadata.enum.map(val => val + "")));
            //     console.log("onUpdate:", tableColumn.onUpdate, columnMetadata.onUpdate);
            //     console.log("isPrimary:", tableColumn.isPrimary, columnMetadata.isPrimary);
            //     console.log("isNullable:", tableColumn.isNullable, columnMetadata.isNullable);
            //     console.log("isUnique:", tableColumn.isUnique, this.normalizeIsUnique(columnMetadata));
            //     console.log("isGenerated:", tableColumn.isGenerated, columnMetadata.isGenerated);
            //     console.log("==========================================");
            // }

            return isColumnChanged;
        });
    }

    /**
     * Returns true if driver supports RETURNING / OUTPUT statement.
     */
    isReturningSqlSupported(): boolean {
        return true;
    }

    /**
     * Returns true if driver supports uuid values generation on its own.
     */
    isUUIDGenerationSupported(): boolean {
        return false;
    }

    /**
     * Returns true if driver supports fulltext indices.
     */
    isFullTextColumnTypeSupported(): boolean {
        return false;
    }

    /**
     * Creates an escaped parameter.
     */
    createParameter(parameterName: string, index: number): string {
        return ":" + (index + 1);
    }

    /**
     * Converts column type in to native oracle type.
     */
    columnTypeToNativeParameter(type: ColumnType): any {
        switch (this.normalizeType({ type: type as any })) {
            case "number":
            case "numeric":
            case "int":
            case "integer":
            case "smallint":
            case "dec":
            case "decimal":
                return this.oracle.NUMBER;
            case "char":
            case "nchar":
            case "nvarchar2":
            case "varchar2":
                return this.oracle.STRING;
            case "blob":
                return this.oracle.BLOB;
            case "clob":
                return this.oracle.CLOB;
            case "date":
            case "timestamp":
            case "timestamp with time zone":
            case "timestamp with local time zone":
                return this.oracle.DATE;
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Loads all driver dependencies.
     */
    protected loadDependencies(): void {
        try {
            const oracle = this.options.driver || PlatformTools.load("oracledb");
            this.oracle = oracle;

        } catch (e) {
            throw new DriverPackageNotInstalledError("Oracle", "oracledb");
        }
    }

    /**
     * Creates a new connection pool for a given database credentials.
     */
    protected async createPool(options: OracleConnectionOptions, credentials: OracleConnectionCredentialsOptions): Promise<any> {

        credentials = Object.assign({}, credentials, DriverUtils.buildDriverOptions(credentials)); // todo: do it better way

        if (!credentials.connectString) {
            let address = `(PROTOCOL=TCP)`;

            if (credentials.host) {
                address += `(HOST=${credentials.host})`;
            }

            if (credentials.port) {
                address += `(PORT=${credentials.port})`;
            }

            let connectData = `(SERVER=DEDICATED)`;

            if (credentials.sid) {
                connectData += `(SID=${credentials.sid})`;
            }

            if (credentials.serviceName) {
                connectData += `(SERVICE_NAME=${credentials.serviceName})`;
            }

            const connectString = `(DESCRIPTION=(ADDRESS=${address})(CONNECT_DATA=${connectData}))`;
            Object.assign(credentials, { connectString });
        }

        // build connection options for the driver
        const connectionOptions = Object.assign({}, {
            user: credentials.username,
            password: credentials.password,
            connectString: credentials.connectString,
        }, options.extra || {});

        // pooling is enabled either when its set explicitly to true,
        // either when its not defined at all (e.g. enabled by default)
        return new Promise<void>((ok, fail) => {
            this.oracle.createPool(connectionOptions, (err: any, pool: any) => {
                if (err)
                    return fail(err);
                ok(pool);
            });
        });

    }

    /**
     * Closes connection pool.
     */
    protected async closePool(pool: any): Promise<void> {
        return new Promise<void>((ok, fail) => {
            pool.close((err: any) => err ? fail(err) : ok());
            pool = undefined;
        });
    }

}
