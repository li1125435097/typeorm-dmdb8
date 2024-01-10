import {Driver} from "../Driver";
import {ConnectionIsNotSetError} from "../../error/ConnectionIsNotSetError";
import {DriverPackageNotInstalledError} from "../../error/DriverPackageNotInstalledError";
import {DmdbQueryRunner} from "./DmdbQueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {DateUtils} from "../../util/DateUtils";
import {PlatformTools} from "../../platform/PlatformTools";
import {Connection} from "../../connection/Connection";
import {RdbmsSchemaBuilder} from "../../schema-builder/RdbmsSchemaBuilder";
import {DmdbConnectionOptions} from "./DmdbConnectionOptions";
import {MappedColumnTypes} from "../types/MappedColumnTypes";
import {ColumnType} from "../types/ColumnTypes";
import {DataTypeDefaults} from "../types/DataTypeDefaults";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {DmdbConnectionCredentialsOptions} from "./DmdbConnectionCredentialsOptions";
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
 * Organizes communication with Dmdb RDBMS.
 */
export class DmdbDriver implements Driver {
    slaves: any[] = [];
    isReplicated: boolean = false;
    treeSupport = true;
    transactionSupport = "nested" as const;
    supportedDataTypes: ColumnType[] = [
        "char",
        "nchar",
        "nvarchar2",
        "varchar2",
        "long",
        "bigint",
        "raw",
        "long raw",
        "number",
        "numeric",
        "float",
        "dec",
        "decimal",
        "integer",
        "int",
        "bit",
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
        "urowid",
        "text",
        "tinyint",
    ];
    spatialTypes: ColumnType[] = [];
    withLengthColumnTypes: ColumnType[] = [
        "char",
        "nchar",
        "nvarchar2",
        "varchar2",
        "varchar",
        "raw"
    ];
    withPrecisionColumnTypes: ColumnType[] = [
        "number",
        "float",
        "timestamp",
        "timestamp with time zone",
        "timestamp with local time zone"
    ];
    withScaleColumnTypes: ColumnType[] = [ "number" ];
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
    maxAliasLength = 29;
    cteCapabilities = { enabled: false };
    connection: Connection;
    options: DmdbConnectionOptions;
    database?: string;
    schema?: string;
    dmdb: any;
    master: any;

    // 达梦驱动构造函数
    constructor(connection: Connection) {
        this.connection = connection;
        this.options = connection.options as DmdbConnectionOptions;

        if (this.options.useUTC === true) process.env.ORA_SDTZ = "UTC"
        
        this.loadDependencies();
        this.database = DriverUtils.buildDriverOptions(this.options.replication ? this.options.replication.master : this.options).database;
        this.schema = DriverUtils.buildDriverOptions(this.options).schema;
    }

    // 数据库连接
    async connect(): Promise<void> {
        this.dmdb.fetchAsString = [ this.dmdb.CLOB ];
        this.dmdb.fetchAsBuffer = [ this.dmdb.BLOB ];
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

    // 无用函数
    afterConnect(): Promise<void> {
        return Promise.resolve();
    }

    // 数据库断开连接
    async disconnect(): Promise<void> {
        if (!this.master) return Promise.reject(new ConnectionIsNotSetError("dmdb"));

        await this.closePool(this.master);
        await Promise.all(this.slaves.map(slave => this.closePool(slave)));
        this.master = undefined;
        this.slaves = [];
    }

    // 创建scheme
    createSchemaBuilder() {
        return new RdbmsSchemaBuilder(this.connection);
    }

    // 创建queryrunner
    createQueryRunner(mode: ReplicationMode) {
        return new DmdbQueryRunner(this, mode);
    }

    // sql语句防注入模版替换
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
        }); 
        return [sql, escapedParameters];
    }

    // 列名添加双引号
    escape(columnName: string): string {
        return `"${columnName}"`;
    }

    // 构造表民串
    buildTableName(tableName: string, schema?: string, database?: string): string {
        let tablePath = [ tableName ];
        if (schema) tablePath.unshift(schema);
        return tablePath.join(".");
    }

    // 解析表民串
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

    // 数据类型值转换
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.transformer) value = ApplyValueTransformers.transformTo(columnMetadata.transformer, value);

        if (value === null || value === undefined) return value;

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

    // 数据类型值转换
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

    // 源数据类型向数据库数据类型转换
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

    // 数据库默认值处理
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

    // 是否唯一索引处理
    normalizeIsUnique(column: ColumnMetadata): boolean {
        return column.entityMetadata.uniques.some(uq => uq.columns.length === 1 && uq.columns[0] === column);
    }

    // 获取数据类型长度
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

    // 创建完整数据类型
    createFullType(column: TableColumn): string {
        let type = column.type;

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

    // 获取主库连接
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

    // 获取从库连接
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

    // 创建实体映射
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

    // 查询数据改变的列
    findChangedColumns(tableColumns: TableColumn[], columnMetadatas: ColumnMetadata[]): ColumnMetadata[] {
        return columnMetadatas.filter(columnMetadata => {
            const tableColumn = tableColumns.find(c => c.name === columnMetadata.databaseName);
            if (!tableColumn) return false;

            const isColumnChanged = tableColumn.name !== columnMetadata.databaseName
                || tableColumn.type !== this.normalizeType(columnMetadata)
                || tableColumn.length !== this.getColumnLength(columnMetadata)
                || tableColumn.precision !== columnMetadata.precision
                || tableColumn.scale !== columnMetadata.scale
                || tableColumn.default !== this.normalizeDefault(columnMetadata)
                || tableColumn.isPrimary !== columnMetadata.isPrimary
                || tableColumn.isNullable !== columnMetadata.isNullable
                || tableColumn.isUnique !== this.normalizeIsUnique(columnMetadata)
                || (columnMetadata.generationStrategy !== "uuid" && tableColumn.isGenerated !== columnMetadata.isGenerated);

            return isColumnChanged;
        });
    }

    // 支持RETURNING / OUTPUT语句
    isReturningSqlSupported(): boolean {
        return true;
    }

    // 不支持生成uuid
    isUUIDGenerationSupported(): boolean {
        return false;
    }

    // 不支持全文索引
    isFullTextColumnTypeSupported(): boolean {
        return false;
    }

    // 创建转义参数
    createParameter(parameterName: string, index: number): string {
        return ":" + (index + 1);
    }

    // 数据类型转换
    columnTypeToNativeParameter(type: ColumnType): any {
        switch (this.normalizeType({ type: type as any })) {
            case "number":
            case "numeric":
            case "int":
            case "integer":
            case "smallint":
            case "dec":
            case "decimal":
            case "tinyint":
                return this.dmdb.NUMBER;
            case "char":
            case "nchar":
            case "nvarchar2":
            case "varchar2":
            case "text":
                return this.dmdb.STRING;
            case "blob":
                return this.dmdb.BLOB;
            case "clob":
                return this.dmdb.CLOB;
            case "date":
            case "timestamp":
            case "timestamp with time zone":
            case "timestamp with local time zone":
                return this.dmdb.DATE;
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    // 加载驱动依赖
    protected loadDependencies(): void {
        try {
            const dmdb = this.options.driver || PlatformTools.load("dmdb");
            this.dmdb = dmdb;

        } catch (e) {
            throw new DriverPackageNotInstalledError("Dmdb", "dmdb");
        }
    }

    // 创建连接池
    protected async createPool(options: DmdbConnectionOptions, credentials: DmdbConnectionCredentialsOptions): Promise<any> {
        credentials = Object.assign({}, credentials, DriverUtils.buildDriverOptions(credentials)); // todo: do it better way

        const { username, password, host, port, database} = credentials
        const connectString = 
        `dm://${username}:${password}@${host}:${port}
        ?SCHEMA=${database}&loginEncrypt=false`

        return new Promise((ok, fail) => {

            this.dmdb.createPool({
                connectString,
                schema: credentials.database,
                database: credentials.database,
                poolMin: 1,
                poolMax: 20,
                poolAlias: 'DMl12skd5fi8',
            }, (err:Error, pool:any) => {
                if (err){
                    console.trace('dmdb connection fail,the connectUrl is: ', connectString);                    
                    return fail(err);
                }
                // pool.getConnection((err:Error,cc:any) => {
                //     if(err) console.trace('失败',err)
                //     cc.execute('select * from area').then(({meta, rows}) => {
                //         console.log('queryResult: ',meta,rows[0][7])
                //     })
                // })
                console.log('\ndameng database connect success\n达梦数据库连接成功')
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
