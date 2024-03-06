import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {Table} from "../../schema-builder/table/Table";
import {TableForeignKey} from "../../schema-builder/table/TableForeignKey";
import {TableIndex} from "../../schema-builder/table/TableIndex";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {View} from "../../schema-builder/view/View";
import {Query} from "../Query";
import {DmdbDriver} from "./DmdbDriver";
import {ReadStream} from "../../platform/PlatformTools";
import {QueryFailedError} from "../../error/QueryFailedError";
import {TableUnique} from "../../schema-builder/table/TableUnique";
import {Broadcaster} from "../../subscriber/Broadcaster";
import {BaseQueryRunner} from "../../query-runner/BaseQueryRunner";
import {OrmUtils} from "../../util/OrmUtils";
import {TableCheck} from "../../schema-builder/table/TableCheck";
import {ColumnType} from "../types/ColumnTypes";
import {IsolationLevel} from "../types/IsolationLevel";
import {TableExclusion} from "../../schema-builder/table/TableExclusion";
import {ReplicationMode} from "../types/ReplicationMode";
import {TypeORMError} from "../../error";
import { QueryResult } from "../../query-runner/QueryResult";
import {MetadataTableType} from "../types/MetadataTableType";

// 在单个数据库连接上运行SQL语句
export class DmdbQueryRunner extends BaseQueryRunner implements QueryRunner {
    // 数据库驱动
    driver: DmdbDriver;
    // 数据库连接promise函数
    protected databaseConnectionPromise: Promise<any>;

    // 调试日志
    private log = (mark:any, txt:any) => (process.env.DMDB_LOG || '1').toLowerCase() === 'true' && console.log(new Date().toLocaleString(),' [INFO] ',mark,' ',txt)

    // 构造函数
    constructor(driver: DmdbDriver, mode: ReplicationMode) {
        super();
        this.log('constructor','start')
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
        this.mode = mode;
    }

    // 数据库连接promise函数单例实现
    connect(): Promise<any> {
        this.log('connect','start')
        if (this.databaseConnection)
            return Promise.resolve(this.databaseConnection);

        if (this.databaseConnectionPromise)
            return this.databaseConnectionPromise;

        if (this.mode === "slave" && this.driver.isReplicated) {
            this.databaseConnectionPromise = this.driver.obtainSlaveConnection().then(connection => {
                this.databaseConnection = connection;
                return this.databaseConnection;
            });

        } else { // master
            this.databaseConnectionPromise = this.driver.obtainMasterConnection().then(connection => {
                this.databaseConnection = connection;
                return this.databaseConnection;
            });
        }

        return this.databaseConnectionPromise;
    }

    // 释放本次获取达connect
    async release(): Promise<void> {
        this.log('release','start')
        this.isReleased = true;
        if (!this.databaseConnection) return
        await this.databaseConnection.close();
    }

    // 开始事物并设置事物隔离级别，必须事物执行完才能读取数据
    async startTransaction(isolationLevel: IsolationLevel = "READ COMMITTED"): Promise<void> {
        this.log('startTransaction','start')
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        // await this.query("START TRANSACTION");
        if (isolationLevel !== "SERIALIZABLE" && isolationLevel !== "READ COMMITTED") {
            throw new TypeORMError(`Dmdb only supports SERIALIZABLE and READ COMMITTED isolation`);
        }

        this.isTransactionActive = true;
        try {
            await this.broadcaster.broadcast('BeforeTransactionStart');
        } catch (err) {
            this.isTransactionActive = false;
            throw err;
        }

        if (this.transactionDepth === 0) {
            await this.query("SET TRANSACTION ISOLATION LEVEL " + isolationLevel);
        } else {
            await this.query(`SAVEPOINT typeorm_${this.transactionDepth}`);
        }
        this.transactionDepth += 1;

        await this.broadcaster.broadcast('AfterTransactionStart');
    }

    // 事务提交
    async commitTransaction(): Promise<void> {
        this.log('commitTransaction','start')
        if (!this.isTransactionActive) throw new TransactionNotStartedError();

        await this.broadcaster.broadcast('BeforeTransactionCommit');

        if (this.transactionDepth === 1) {
            await this.query("COMMIT");
            this.isTransactionActive = false;
        }
        this.transactionDepth -= 1;

        await this.broadcaster.broadcast('AfterTransactionCommit');
    }

    // 事物回滚
    async rollbackTransaction(): Promise<void> {
        this.log('rollbackTransaction','start')
        if (!this.isTransactionActive) throw new TransactionNotStartedError();
        await this.broadcaster.broadcast('BeforeTransactionRollback');

        if (this.transactionDepth > 1) {
            await this.query(`ROLLBACK TO SAVEPOINT typeorm_${this.transactionDepth - 1}`);
        } else {
            await this.query("ROLLBACK");
            this.isTransactionActive = false;
        }
        this.transactionDepth -= 1;

        await this.broadcaster.broadcast('AfterTransactionRollback');
    }

    // 数据库sql语句执行函数
    async query(query: string, parameters?: any[], useStructuredResult = false): Promise<any> {
        this.log('query','start')
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError();
        // 执行hook
        const hookData = this.queryHook(query, parameters)
        if(hookData){
            query = hookData.query
            parameters = hookData.parameters
        }

        const databaseConnection = await this.connect();
        this.driver.connection.logger.logQuery(query, parameters, this);
        const queryStartTime = +new Date();

        try {
            const executionOptions = {
                autoCommit: !this.isTransactionActive,
                outFormat: this.driver.dmdb.OUT_FORMAT_OBJECT,
            };

            const raw = await databaseConnection.execute(query, parameters || {}, executionOptions);

            // log slow queries if maxQueryExecution time is set
            const maxQueryExecutionTime = this.driver.options.maxQueryExecutionTime;
            const queryEndTime = +new Date();
            const queryExecutionTime = queryEndTime - queryStartTime;
            if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);

            const result = new QueryResult();

            result.raw = raw.rows || raw.outBinds || raw.rowsAffected || raw.implicitResults;

            if (raw?.hasOwnProperty('rows') && Array.isArray(raw.rows)) {
                result.records = raw.rows;
            }

            if (raw?.hasOwnProperty('outBinds') && Array.isArray(raw.outBinds)) {
                result.records = raw.outBinds;
            }

            if (raw?.hasOwnProperty('implicitResults') && Array.isArray(raw.implicitResults)) {
                result.records = raw.implicitResults;
            }

            if (raw?.hasOwnProperty('rowsAffected')) {
                result.affected = raw.rowsAffected;
            }

            return useStructuredResult ? result : result.raw
            
        } catch (err) {

            // 数据库查询不兼容处理
            const defendResult = await this.queryDefend(query, parameters, err)
            if(defendResult){
                this.log('\ntypeorm-dmdb8 [info] trigger DmdbQueryRunner defend: ',{query,parameters})
                return defendResult
            }

            this.driver.connection.logger.logQueryError(err, query, parameters, this);
            throw new QueryFailedError(query, parameters, err);
        }
    }

    // 数据库sql语句执行函数钩子
    queryHook(query: string, parameters?: any[]){
        if(!parameters) return false
        let isReturn = false
        this.log({query,parameters},'dddddddddddddddddmmmmmmmmmmmmmmm');

        // 参数null值处理
        const templateChar = query.match(/(\:\d* )|\?/g) || []
        templateChar.map((v:any,i:number) => {
            if(parameters[i] === null){
                query = query.replace(v,'null ')
                parameters.splice(i,1)
            }
            this.log('typeorm-dmdb8 [info] queryHook ',`null替换 ${query}`)
        })

        // 统计count处理
        query = query.replace(' as count ',' "count" ')

        // 去除别名引号
        query = query.replace(/"[a-zA-Z]"/g, alias => {
            this.log('typeorm-dmdb8 [info] queryHook ',`别名替换 ${alias} -> ${alias.slice(1,-1)}`)
            isReturn = true
            return alias.slice(1,-1)
        })

        // 反撇号转换
        if(query.match('`')){
            query = query.replace(/`/g,'"')
            isReturn = true
        }

        // in语法处理
        const matchin = query.match(/in\(:\d*\)/g)
        if(matchin){
            const oldQuery = query
            matchin.map((v:any) => {
                query = query.replace(v.slice(3, -1), parameters[v.slice(4,-1) - 1])
                parameters.splice(v.slice(4,-1) - 1, 1)
            })
            this.log('typeorm-dmdb8 [info] queryHook ',`in替换 ${oldQuery} -> ${query}}`)
            return {query, parameters}
        }
        
        if(isReturn) return { query: query, parameters: parameters };
        return false
    }

    /**
     * query函数cb。达梦数据库查询防御工事，用来解决不兼容但正确达语句
     * @param {string} query sqlString
     * @param {object} parameters sqlString value
     * @param {Error} err
     * @returns 
     */
    async queryDefend(query: string, parameters: any[]|undefined, err:any) {
        const errCodeMap:any = {"-2124":'表已存在',"-2140":'索引已存在'}      // 达梦错误码


        // sql数据库版本处理
        if(query === 'SELECT VERSION() AS version'){
            const version = await this.query("SELECT * FROM v$version;").catch(err => {return false})
            this.log('queryDefend','typeorm-dmdb8 [info] queryDefend 数据库版本语法纠正')
            return [{version:version[1].BANNER}]
        }
        // 删除主键索引处理
        else if(query.startsWith('DROP INDEX "INDEX') || query.startsWith('CREATE UNIQUE INDEX "INDEX')){
            this.log('queryDefend','typeorm-dmdb8 [info] queryDefend 索引删除或新建纠正 ')
            return []
        }
        // 达梦数据库错误码处理
        else if(errCodeMap[err.errCode]){
            this.log('queryDefend','typeorm-dmdb8 [info] queryDefend 达梦数据库错误码'+errCodeMap[err.errCode])
            return []
        }
        else return false
    }

    // 数据库sql语句执行函数，返回流
    async stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
        this.log('stream','start')
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        const executionOptions = {
            autoCommit: !this.isTransactionActive,
            outFormat: this.driver.dmdb.OBJECT,
        }

        const databaseConnection = await this.connect();
        this.driver.connection.logger.logQuery(query, parameters, this);

        try {
            const stream = databaseConnection.queryStream(query, parameters, executionOptions);
            if (onEnd) stream.on("end", onEnd);
            if (onError) stream.on("error", onError);
            return stream;
        } catch (err) {
            this.driver.connection.logger.logQueryError(err, query, parameters, this);
            throw new QueryFailedError(query, parameters, err);
        }
    }

    // 无用函数
    async getDatabases(): Promise<string[]> {
        return Promise.resolve([]);
    }

    // 无用函数
    async getSchemas(database?: string): Promise<string[]> {
        return Promise.resolve([]);
    }

    // 判断数据库是否存在
    async hasDatabase(database: string): Promise<boolean> {
        this.log('hasDatabase','start')
        try {
            const query = await this.query( `SELECT 1 AS "exists" FROM global_name@"${database}"`)
            return query.length > 0;
        } catch (e) {
            return false;
        }
    }

    // 获取当前数据库名称
    async getCurrentDatabase(): Promise<undefined> {
        this.log('getCurrentDatabase','start')
        const query = await this.query(`SELECT SYS_CONTEXT('USERENV','DB_NAME') AS "db_name" FROM dual`)
        return query[0]["db_name"]
    }

    // 无用函数
    async hasSchema(schema: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    // 获取当前数据库名称
    async getCurrentSchema(): Promise<string> {
        this.log('getCurrentDatabase','start')
        const query = await this.query(`SELECT SYS_CONTEXT('USERENV','DB_NAME') AS "schema_name" FROM dual`)
        return query[0]["db_name"]
    }

    // 检查表名是否存在
    async hasTable(tableOrName: Table|string): Promise<boolean> {
        this.log('hasTable','start')
        const { tableName } = this.driver.parseTableName(tableOrName);
        const sql = `SELECT "TABLE_NAME" FROM "USER_TABLES" WHERE "TABLE_NAME" = '${tableName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    // 检查表是否存在该列
    async hasColumn(tableOrName: Table|string, columnName: string): Promise<boolean> {
        this.log('hasColumn','start')
        const { tableName } = this.driver.parseTableName(tableOrName);
        const sql = `SELECT "COLUMN_NAME" FROM "USER_TAB_COLS" WHERE "TABLE_NAME" = '${tableName}' AND "COLUMN_NAME" = '${columnName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    // 创建一个数据库
    async createDatabase(database: string, ifNotExist?: boolean): Promise<void> {
        this.log('createDatabase','start')
        if (ifNotExist) {
            try {
                await this.query(`CREATE DATABASE IF NOT EXISTS "${database}";`);
            } catch (e) {
                // if (e instanceof QueryFailedError) {
                if (e.message.includes("ORA-01100: database already mounted")) return
                // }
                throw e;
            }
        } else {
            await this.query(`CREATE DATABASE "${database}"`);
        }
    }

    // 无用函数
    async dropDatabase(database: string, ifExist?: boolean): Promise<void> {
        return Promise.resolve();
    }

    // 无用函数
    async createSchema(schemaPath: string, ifNotExist?: boolean): Promise<void> {
        throw new TypeORMError(`Schema create queries are not supported by Dmdb driver.`);
    }

    // 无用函数
    async dropSchema(schemaPath: string, ifExist?: boolean): Promise<void> {
        throw new TypeORMError(`Schema drop queries are not supported by Dmdb driver.`);
    }

    // 建表
    async createTable(table: Table, ifNotExist: boolean = false, createForeignKeys: boolean = true, createIndices: boolean = true): Promise<void> {
        this.log('createTable','start')
        if (ifNotExist) {
            const isTableExist = await this.hasTable(table);
            if (isTableExist) return Promise.resolve();
        }
        const upQueries: Query[] = [];
        const downQueries: Query[] = [];

        upQueries.push(this.createTableSql(table, createForeignKeys));
        downQueries.push(this.dropTableSql(table));

        // if createForeignKeys is true, we must drop created foreign keys in down query.
        // createTable does not need separate method to create foreign keys, because it create fk's in the same query with table creation.
        if (createForeignKeys)
            table.foreignKeys.forEach(foreignKey => downQueries.push(this.dropForeignKeySql(table, foreignKey)));

        if (createIndices) {
            table.indices.forEach(index => {
                // new index may be passed without name. In this case we generate index name manually.
                if (!index.name)
                    index.name = this.connection.namingStrategy.indexName(table, index.columnNames, index.where);
                upQueries.push(this.createIndexSql(table, index));
                downQueries.push(this.dropIndexSql(index));
            });
        }

        // if table have column with generated type, we must add the expression to the metadata table
        const generatedColumns = table.columns.filter((column) => column.generatedType && column.asExpression);
        for (const column of generatedColumns) {
            const insertQuery = this.insertTypeormMetadataSql({
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
                value: column.asExpression,
            });
            const deleteQuery = this.deleteTypeormMetadataSql({
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
            });
            upQueries.push(insertQuery);
            downQueries.push(deleteQuery);
        }

        await this.executeQueries(upQueries, downQueries);
    }

    // 删表
    async dropTable(tableOrName: Table|string, ifExist?: boolean, dropForeignKeys: boolean = true, dropIndices: boolean = true): Promise<void> {// It needs because if table does not exist and dropForeignKeys or dropIndices is true, we don't need
        this.log('dropTable','start')
        // to perform drop queries for foreign keys and indices.
        if (ifExist) {
            const isTableExist = await this.hasTable(tableOrName);
            if (!isTableExist) return Promise.resolve();
        }

        // if dropTable called with dropForeignKeys = true, we must create foreign keys in down query.
        const createForeignKeys: boolean = dropForeignKeys;
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const upQueries: Query[] = [];
        const downQueries: Query[] = [];


        if (dropIndices) {
            table.indices.forEach(index => {
                upQueries.push(this.dropIndexSql(index));
                downQueries.push(this.createIndexSql(table, index));
            });
        }

        // if dropForeignKeys is true, we just drop the table, otherwise we also drop table foreign keys.
        // createTable does not need separate method to create foreign keys, because it create fk's in the same query with table creation.
        if (dropForeignKeys)
            table.foreignKeys.forEach(foreignKey => upQueries.push(this.dropForeignKeySql(table, foreignKey)));

        upQueries.push(this.dropTableSql(table));
        downQueries.push(this.createTableSql(table, createForeignKeys));

        // if table had columns with generated type, we must remove the expression from the metadata table
        const generatedColumns = table.columns.filter((column) => column.generatedType && column.asExpression);
        for (const column of generatedColumns) {
            const deleteQuery = this.deleteTypeormMetadataSql({
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
            });
            const insertQuery = this.insertTypeormMetadataSql({
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
                value: column.asExpression,
            });
            upQueries.push(deleteQuery);
            downQueries.push(insertQuery);
        }
        await this.executeQueries(upQueries, downQueries);
    }

    // 创建视图
    async createView(view: View): Promise<void> {
        this.log('createView','start')
        const upQueries: Query[] = [];
        const downQueries: Query[] = [];
        upQueries.push(this.createViewSql(view));
        upQueries.push(this.insertViewDefinitionSql(view));
        downQueries.push(this.dropViewSql(view));
        downQueries.push(this.deleteViewDefinitionSql(view));
        await this.executeQueries(upQueries, downQueries);
    }

    // 删除视图
    async dropView(target: View|string): Promise<void> {
        this.log('dropView','start')
        const viewName = target instanceof View ? target.name : target;
        const view = await this.getCachedView(viewName);

        const upQueries: Query[] = [];
        const downQueries: Query[] = [];
        upQueries.push(this.deleteViewDefinitionSql(view));
        upQueries.push(this.dropViewSql(view));
        downQueries.push(this.insertViewDefinitionSql(view));
        downQueries.push(this.createViewSql(view));
        await this.executeQueries(upQueries, downQueries);
    }

    // 表名修改
    async renameTable(oldTableOrName: Table|string, newTableName: string): Promise<void> {
        this.log('renameTable','start')
        const upQueries: Query[] = [];
        const downQueries: Query[] = [];
        const oldTable = oldTableOrName instanceof Table ? oldTableOrName : await this.getCachedTable(oldTableOrName);
        let newTable = oldTable.clone();

        const { database: dbName, tableName: oldTableName } = this.driver.parseTableName(oldTable);

        newTable.name = dbName ? `${dbName}.${newTableName}` : newTableName;

        // rename table
        upQueries.push(new Query(`ALTER TABLE ${this.escapePath(oldTable)} RENAME TO "${newTableName}"`));
        downQueries.push(new Query(`ALTER TABLE ${this.escapePath(newTable)} RENAME TO "${oldTableName}"`));

        // rename primary key constraint
        if (newTable.primaryColumns.length > 0) {
            const columnNames = newTable.primaryColumns.map(column => column.name);

            const oldPkName = this.connection.namingStrategy.primaryKeyName(oldTable, columnNames);
            const newPkName = this.connection.namingStrategy.primaryKeyName(newTable, columnNames);

            // build queries
            upQueries.push(new Query(`ALTER TABLE ${this.escapePath(newTable)} RENAME CONSTRAINT "${oldPkName}" TO "${newPkName}"`));
            downQueries.push(new Query(`ALTER TABLE ${this.escapePath(newTable)} RENAME CONSTRAINT "${newPkName}" TO "${oldPkName}"`));
        }

        // rename unique constraints
        newTable.uniques.forEach(unique => {
            const oldUniqueName = this.connection.namingStrategy.uniqueConstraintName(oldTable, unique.columnNames);
            // Skip renaming if Unique has user defined constraint name
            if (unique.name !== oldUniqueName) return

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
            const oldIndexName = this.connection.namingStrategy.indexName(oldTable, index.columnNames, index.where);
            // Skip renaming if Index has user defined constraint name
            if (index.name !== oldIndexName) return

            // build new constraint name
            const newIndexName = this.connection.namingStrategy.indexName(newTable, index.columnNames, index.where);

            // build queries
            upQueries.push(new Query(`ALTER INDEX "${index.name}" RENAME TO "${newIndexName}"`));
            downQueries.push(new Query(`ALTER INDEX "${newIndexName}" RENAME TO "${index.name}"`));

            // replace constraint name
            index.name = newIndexName;
        });

        // rename foreign key constraints
        newTable.foreignKeys.forEach(foreignKey => {
            const oldForeignKeyName = this.connection.namingStrategy.foreignKeyName(oldTable, foreignKey.columnNames, this.getTablePath(foreignKey), foreignKey.referencedColumnNames);
            // Skip renaming if foreign key has user defined constraint name
            if (foreignKey.name !== oldForeignKeyName) return

            // build new constraint name
            const newForeignKeyName = this.connection.namingStrategy.foreignKeyName(newTable, foreignKey.columnNames, this.getTablePath(foreignKey), foreignKey.referencedColumnNames);

            // build queries
            upQueries.push(new Query(`ALTER TABLE ${this.escapePath(newTable)} RENAME CONSTRAINT "${foreignKey.name}" TO "${newForeignKeyName}"`));
            downQueries.push(new Query(`ALTER TABLE ${this.escapePath(newTable)} RENAME CONSTRAINT "${newForeignKeyName}" TO "${foreignKey.name}"`));

            // replace constraint name
            foreignKey.name = newForeignKeyName;
        });

        await this.executeQueries(upQueries, downQueries);

        // rename old table and replace it in cached tabled;
        oldTable.name = newTable.name;
        this.replaceCachedTable(oldTable, newTable);
    }

    // 新增列
    async addColumn(tableOrName: Table|string, column: TableColumn): Promise<void> {
        this.log('addColumn','start')
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();
        const upQueries: Query[] = [];
        const downQueries: Query[] = [];

        upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ADD ${this.buildCreateColumnSql(column)}`));
        downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} DROP COLUMN "${column.name}"`));

        // create or update primary key constraint
        if (column.isPrimary) {
            const primaryColumns = clonedTable.primaryColumns;
            // if table already have primary key, me must drop it and recreate again
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
            clonedTable.indices.splice(clonedTable.indices.indexOf(columnIndex), 1);
            upQueries.push(this.createIndexSql(table, columnIndex));
            downQueries.push(this.dropIndexSql(columnIndex));
        }

        // create unique constraint
        if (column.isUnique) {
            const uniqueConstraint = new TableUnique({
                name: this.connection.namingStrategy.uniqueConstraintName(table, [column.name]),
                columnNames: [column.name]
            });
            clonedTable.uniques.push(uniqueConstraint);
            upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${column.name}")`));
            downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${uniqueConstraint.name}"`));
        }

        if (column.generatedType && column.asExpression) {
            const insertQuery = this.insertTypeormMetadataSql({
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
                value: column.asExpression,
            });
            const deleteQuery = this.deleteTypeormMetadataSql({
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
            });
            upQueries.push(insertQuery);
            downQueries.push(deleteQuery);
        }

        await this.executeQueries(upQueries, downQueries);
        clonedTable.addColumn(column);
        this.replaceCachedTable(table, clonedTable);
    }

    // 新增多列
    async addColumns(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        this.log('addColumns','start')
        for (const column of columns) await this.addColumn(tableOrName, column)
    }

    // 列名修改
    async renameColumn(tableOrName: Table|string, oldTableColumnOrName: TableColumn|string, newTableColumnOrName: TableColumn|string): Promise<void> {
        this.log('renameColumn','start')
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const oldColumn = oldTableColumnOrName instanceof TableColumn ? oldTableColumnOrName : table.columns.find(c => c.name === oldTableColumnOrName);
        if (!oldColumn)
            throw new TypeORMError(`Column "${oldTableColumnOrName}" was not found in the ${this.escapePath(table)} table.`);

        let newColumn: TableColumn|undefined = undefined;
        if (newTableColumnOrName instanceof TableColumn) {
            newColumn = newTableColumnOrName;
        } else {
            newColumn = oldColumn.clone();
            newColumn.name = newTableColumnOrName;
        }

        await this.changeColumn(table, oldColumn, newColumn);
    }

    // 列修改
    async changeColumn(tableOrName: Table|string, oldTableColumnOrName: TableColumn|string, newColumn: TableColumn): Promise<void> {
        this.log('changeColumn','start')
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        let clonedTable = table.clone();
        const upQueries: Query[] = [];
        const downQueries: Query[] = [];

        const oldColumn = oldTableColumnOrName instanceof TableColumn
            ? oldTableColumnOrName
            : table.columns.find(column => column.name === oldTableColumnOrName);
        if (!oldColumn)
            throw new TypeORMError(`Column "${oldTableColumnOrName}" was not found in the ${this.escapePath(table)} table.`);

        if ((newColumn.isGenerated !== oldColumn.isGenerated && newColumn.generationStrategy !== "uuid") || oldColumn.type !== newColumn.type || oldColumn.length !== newColumn.length || oldColumn.generatedType !== newColumn.generatedType || oldColumn.asExpression !== newColumn.asExpression) {
            // Dmdb does not support changing of IDENTITY column, so we must drop column and recreate it again.
            // Also, we recreate column if column type changed
            await this.dropColumn(table, oldColumn);
            await this.addColumn(table, newColumn);

            // update cloned table
            clonedTable = table.clone();

        } else {
            if (newColumn.name !== oldColumn.name) {
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
                    const oldUniqueName = this.connection.namingStrategy.uniqueConstraintName(clonedTable, unique.columnNames);
                    // Skip renaming if Unique has user defined constraint name
                    if (unique.name !== oldUniqueName) return

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
                    const oldIndexName = this.connection.namingStrategy.indexName(clonedTable, index.columnNames, index.where);
                    // Skip renaming if Index has user defined constraint name
                    if (index.name !== oldIndexName) return

                    // build new constraint name
                    index.columnNames.splice(index.columnNames.indexOf(oldColumn.name), 1);
                    index.columnNames.push(newColumn.name);
                    const newIndexName = this.connection.namingStrategy.indexName(clonedTable, index.columnNames, index.where);

                    // build queries
                    upQueries.push(new Query(`ALTER INDEX "${index.name}" RENAME TO "${newIndexName}"`));
                    downQueries.push(new Query(`ALTER INDEX "${newIndexName}" RENAME TO "${index.name}"`));

                    // replace constraint name
                    index.name = newIndexName;
                });

                // rename foreign key constraints
                clonedTable.findColumnForeignKeys(oldColumn).forEach(foreignKey => {
                    const foreignKeyName = this.connection.namingStrategy.foreignKeyName(clonedTable, foreignKey.columnNames, this.getTablePath(foreignKey), foreignKey.referencedColumnNames);
                    // Skip renaming if foreign key has user defined constraint name
                    if (foreignKey.name !== foreignKeyName) return

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

            if (this.isColumnChanged(oldColumn, newColumn, true)) {
                let defaultUp: string = "";
                let defaultDown: string = "";
                let nullableUp:  string = "";
                let nullableDown:  string = "";

                // changing column default
                if (newColumn.default !== null && newColumn.default !== undefined) {
                    defaultUp = `DEFAULT ${newColumn.default}`;

                    if (oldColumn.default !== null && oldColumn.default !== undefined) {
                        defaultDown = `DEFAULT ${oldColumn.default}`;
                    } else {
                        defaultDown = "DEFAULT NULL";
                    }

                } else if (oldColumn.default !== null && oldColumn.default !== undefined) {
                    defaultUp = "DEFAULT NULL";
                    defaultDown = `DEFAULT ${oldColumn.default}`;
                }

                // changing column isNullable property
                if (newColumn.isNullable !== oldColumn.isNullable) {
                    if (newColumn.isNullable === true) {
                        nullableUp = "NULL";
                        nullableDown = "NOT NULL";
                    } else {
                        nullableUp = "NOT NULL";
                        nullableDown = "NULL";
                    }
                }

                upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} MODIFY "${oldColumn.name}" ${this.connection.driver.createFullType(newColumn)} ${defaultUp} ${nullableUp}`));
                downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} MODIFY "${oldColumn.name}" ${this.connection.driver.createFullType(oldColumn)} ${defaultDown} ${nullableDown}`));
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
                if (newColumn.isUnique === true) {
                    const uniqueConstraint = new TableUnique({
                        name: this.connection.namingStrategy.uniqueConstraintName(table, [newColumn.name]),
                        columnNames: [newColumn.name]
                    });
                    clonedTable.uniques.push(uniqueConstraint);
                    upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${newColumn.name}")`));
                    downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${uniqueConstraint.name}"`));

                } else {
                    const uniqueConstraint = clonedTable.uniques.find(unique => {
                        return unique.columnNames.length === 1 && !!unique.columnNames.find(columnName => columnName === newColumn.name);
                    });
                    clonedTable.uniques.splice(clonedTable.uniques.indexOf(uniqueConstraint!), 1);
                    upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${uniqueConstraint!.name}"`));
                    downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${uniqueConstraint!.name}" UNIQUE ("${newColumn.name}")`));
                }
            }

            await this.executeQueries(upQueries, downQueries);
            this.replaceCachedTable(table, clonedTable);
        }
    }

    // 多列修改
    async changeColumns(tableOrName: Table|string, changedColumns: { newColumn: TableColumn, oldColumn: TableColumn }[]): Promise<void> {
        this.log('changeColumns','start')
        for (const {oldColumn, newColumn} of changedColumns) {
            await this.changeColumn(tableOrName, oldColumn, newColumn);
        }
    }

    // 删除列
    async dropColumn(tableOrName: Table|string, columnOrName: TableColumn|string): Promise<void> {
        this.log('dropColumn','start')
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const column = columnOrName instanceof TableColumn ? columnOrName : table.findColumnByName(columnOrName);
        if (!column)
            throw new TypeORMError(`Column "${columnOrName}" was not found in table ${this.escapePath(table)}`);

        const clonedTable = table.clone();
        const upQueries: Query[] = [];
        const downQueries: Query[] = [];

        // drop primary key constraint
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
            upQueries.push(this.dropIndexSql(columnIndex));
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
            upQueries.push(this.dropUniqueConstraintSql(table, columnUnique));
            downQueries.push(this.createUniqueConstraintSql(table, columnUnique));
        }

        upQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} DROP COLUMN "${column.name}"`));
        downQueries.push(new Query(`ALTER TABLE ${this.escapePath(table)} ADD ${this.buildCreateColumnSql(column)}`));

        if (column.generatedType && column.asExpression) {
            const deleteQuery = this.deleteTypeormMetadataSql({
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
            });
            const insertQuery = this.insertTypeormMetadataSql({
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
                value: column.asExpression,
            });
            upQueries.push(deleteQuery);
            downQueries.push(insertQuery);
        }

        await this.executeQueries(upQueries, downQueries);
        clonedTable.removeColumn(column);
        this.replaceCachedTable(table, clonedTable);
    }

    // 删除多列
    async dropColumns(tableOrName: Table|string, columns: TableColumn[]|string[]): Promise<void> {
        this.log('dropColumns','start')
        for (const column of columns) {
            await this.dropColumn(tableOrName, column);
        }
    }

    // 创建主键
    async createPrimaryKey(tableOrName: Table|string, columnNames: string[]): Promise<void> {
        this.log('createPrimaryKey','start')
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

    // 更新主键
    async updatePrimaryKeys(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        this.log('updatePrimaryKeys','start')
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const columnNames = columns.map(column => column.name);
        const clonedTable = table.clone();
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

    // 删除主键
    async dropPrimaryKey(tableOrName: Table|string): Promise<void> {
        this.log("dropPrimaryKey","start");
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const up = this.dropPrimaryKeySql(table);
        const down = this.createPrimaryKeySql(table, table.primaryColumns.map(column => column.name));
        await this.executeQueries(up, down);
        table.primaryColumns.forEach(column => {
            column.isPrimary = false;
        });
    }

    // 创建唯一约束
    async createUniqueConstraint(tableOrName: Table|string, uniqueConstraint: TableUnique): Promise<void> {
        this.log('createUniqueConstraint','start')
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        // new unique constraint may be passed without name. In this case we generate unique name manually.
        if (!uniqueConstraint.name)
            uniqueConstraint.name = this.connection.namingStrategy.uniqueConstraintName(table, uniqueConstraint.columnNames);

        const up = this.createUniqueConstraintSql(table, uniqueConstraint);
        const down = this.dropUniqueConstraintSql(table, uniqueConstraint);
        await this.executeQueries(up, down);
        table.addUniqueConstraint(uniqueConstraint);
    }

    // 创建多个唯一约束
    async createUniqueConstraints(tableOrName: Table|string, uniqueConstraints: TableUnique[]): Promise<void> {
        this.log('createUniqueConstraints','start')
        const promises = uniqueConstraints.map(uniqueConstraint => this.createUniqueConstraint(tableOrName, uniqueConstraint));
        await Promise.all(promises);
    }

    // 删除唯一约束
    async dropUniqueConstraint(tableOrName: Table|string, uniqueOrName: TableUnique|string): Promise<void> {
        this.log('dropUniqueConstraint','start')
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const uniqueConstraint = uniqueOrName instanceof TableUnique ? uniqueOrName : table.uniques.find(u => u.name === uniqueOrName);
        if (!uniqueConstraint)
            throw new TypeORMError(`Supplied unique constraint was not found in table ${table.name}`);

        const up = this.dropUniqueConstraintSql(table, uniqueConstraint);
        const down = this.createUniqueConstraintSql(table, uniqueConstraint);
        await this.executeQueries(up, down);
        table.removeUniqueConstraint(uniqueConstraint);
    }

    // 删除多个唯一约束
    async dropUniqueConstraints(tableOrName: Table|string, uniqueConstraints: TableUnique[]): Promise<void> {
        this.log('dropUniqueConstraints','start')
        const promises = uniqueConstraints.map(uniqueConstraint => this.dropUniqueConstraint(tableOrName, uniqueConstraint));
        await Promise.all(promises);
    }

    // 创建一个检查约束
    async createCheckConstraint(tableOrName: Table|string, checkConstraint: TableCheck): Promise<void> {
        this.log('createCheckConstraint','start')
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        // new unique constraint may be passed without name. In this case we generate unique name manually.
        if (!checkConstraint.name)
            checkConstraint.name = this.connection.namingStrategy.checkConstraintName(table, checkConstraint.expression!);

        const up = this.createCheckConstraintSql(table, checkConstraint);
        const down = this.dropCheckConstraintSql(table, checkConstraint);
        await this.executeQueries(up, down);
        table.addCheckConstraint(checkConstraint);
    }

    // 创建多个检查约束
    async createCheckConstraints(tableOrName: Table|string, checkConstraints: TableCheck[]): Promise<void> {
        this.log('createCheckConstraints','start')
        const promises = checkConstraints.map(checkConstraint => this.createCheckConstraint(tableOrName, checkConstraint));
        await Promise.all(promises);
    }

    // 删除检查约束
    async dropCheckConstraint(tableOrName: Table|string, checkOrName: TableCheck|string): Promise<void> {
        this.log('dropCheckConstraint','start')
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const checkConstraint = checkOrName instanceof TableCheck ? checkOrName : table.checks.find(c => c.name === checkOrName);
        if (!checkConstraint)
            throw new TypeORMError(`Supplied check constraint was not found in table ${table.name}`);

        const up = this.dropCheckConstraintSql(table, checkConstraint);
        const down = this.createCheckConstraintSql(table, checkConstraint);
        await this.executeQueries(up, down);
        table.removeCheckConstraint(checkConstraint);
    }

    // 删除多个检查约束
    async dropCheckConstraints(tableOrName: Table|string, checkConstraints: TableCheck[]): Promise<void> {
        this.log('dropCheckConstraints','start')
        const promises = checkConstraints.map(checkConstraint => this.dropCheckConstraint(tableOrName, checkConstraint));
        await Promise.all(promises);
    }

    // 无用函数
    async createExclusionConstraint(tableOrName: Table|string, exclusionConstraint: TableExclusion): Promise<void> {
        throw new TypeORMError(`Dmdb does not support exclusion constraints.`);
    }

    // 无用函数
    async createExclusionConstraints(tableOrName: Table|string, exclusionConstraints: TableExclusion[]): Promise<void> {
        throw new TypeORMError(`Dmdb does not support exclusion constraints.`);
    }

    // 无用函数
    async dropExclusionConstraint(tableOrName: Table|string, exclusionOrName: TableExclusion|string): Promise<void> {
        throw new TypeORMError(`Dmdb does not support exclusion constraints.`);
    }

    // 无用函数
    async dropExclusionConstraints(tableOrName: Table|string, exclusionConstraints: TableExclusion[]): Promise<void> {
        throw new TypeORMError(`Dmdb does not support exclusion constraints.`);
    }

    // 创建一个外键
    async createForeignKey(tableOrName: Table|string, foreignKey: TableForeignKey): Promise<void> {
        this.log('createForeignKey','start')
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        // new FK may be passed without name. In this case we generate FK name manually.
        if (!foreignKey.name)
            foreignKey.name = this.connection.namingStrategy.foreignKeyName(table, foreignKey.columnNames, this.getTablePath(foreignKey), foreignKey.referencedColumnNames);

        const up = this.createForeignKeySql(table, foreignKey);
        const down = this.dropForeignKeySql(table, foreignKey);
        await this.executeQueries(up, down);
        table.addForeignKey(foreignKey);
    }

    // 创建多个外键
    async createForeignKeys(tableOrName: Table|string, foreignKeys: TableForeignKey[]): Promise<void> {
        this.log('createForeignKeys','start')
        const promises = foreignKeys.map(foreignKey => this.createForeignKey(tableOrName, foreignKey));
        await Promise.all(promises);
    }

    // 删除外键
    async dropForeignKey(tableOrName: Table|string, foreignKeyOrName: TableForeignKey|string): Promise<void> {
        this.log('dropForeignKey','start')
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const foreignKey = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName : table.foreignKeys.find(fk => fk.name === foreignKeyOrName);
        if (!foreignKey)
            throw new TypeORMError(`Supplied foreign key was not found in table ${table.name}`);

        const up = this.dropForeignKeySql(table, foreignKey);
        const down = this.createForeignKeySql(table, foreignKey);
        await this.executeQueries(up, down);
        table.removeForeignKey(foreignKey);
    }

    // 删除多个外键
    async dropForeignKeys(tableOrName: Table|string, foreignKeys: TableForeignKey[]): Promise<void> {
        this.log('dropForeignKeys','start')
        const promises = foreignKeys.map(foreignKey => this.dropForeignKey(tableOrName, foreignKey));
        await Promise.all(promises);
    }

    // 创建索引
    async createIndex(tableOrName: Table|string, index: TableIndex): Promise<void> {
        this.log('createIndex','start')
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        // new index may be passed without name. In this case we generate index name manually.
        if (!index.name)
            index.name = this.connection.namingStrategy.indexName(table, index.columnNames, index.where);

        const up = this.createIndexSql(table, index);
        const down = this.dropIndexSql(index);
        await this.executeQueries(up, down);
        table.addIndex(index);
    }

    // 创建多个索引
    async createIndices(tableOrName: Table|string, indices: TableIndex[]): Promise<void> {
        this.log('createIndexs','start')
        const promises = indices.map(index => this.createIndex(tableOrName, index));
        await Promise.all(promises);
    }

    // 删除索引
    async dropIndex(tableOrName: Table|string, indexOrName: TableIndex|string): Promise<void> {
        this.log('dropIndex','start')

        // 达梦数据库主键保护
        const indexObj:any = indexOrName
        if(indexObj.name.startsWith('INDEX')) return console.error(indexObj.name+' 为主键索引，禁止删除！！！')

        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const index = indexOrName instanceof TableIndex ? indexOrName : table.indices.find(i => i.name === indexOrName);
        if (!index)
            throw new TypeORMError(`Supplied index ${indexOrName} was not found in table ${table.name}`);

        const up = this.dropIndexSql(index);
        const down = this.createIndexSql(table, index);
        await this.executeQueries(up, down);
        table.removeIndex(index);
    }

    // 删除多个索引
    async dropIndices(tableOrName: Table|string, indices: TableIndex[]): Promise<void> {
        this.log('dropIndexs','start')
        const promises = indices.map(index => this.dropIndex(tableOrName, index));
        await Promise.all(promises);
    }

    // 清空表
    async clearTable(tableName: string): Promise<void> {
        this.log('clearTable','start')
        await this.query(`TRUNCATE TABLE ${this.escapePath(tableName)}`);
    }

    // 清空数据库
    async clearDatabase(): Promise<void> {
        this.log('clearDatabase','start')
        const isAnotherTransactionActive = this.isTransactionActive;
        if (!isAnotherTransactionActive) await this.startTransaction()
        try {
            // drop views
            const dropViewsQuery = `SELECT 'DROP VIEW "' || VIEW_NAME || '"' AS "query" FROM "USER_VIEWS"`;
            const dropViewQueries: ObjectLiteral[] = await this.query(dropViewsQuery);
            await Promise.all(dropViewQueries.map(query => this.query(query["query"])));

            // drop materialized views
            const dropMatViewsQuery = `SELECT 'DROP MATERIALIZED VIEW "' || MVIEW_NAME || '"' AS "query" FROM "USER_MVIEWS"`;
            const dropMatViewQueries: ObjectLiteral[] = await this.query(dropMatViewsQuery);
            await Promise.all(dropMatViewQueries.map(query => this.query(query["query"])));

            // drop tables
            const dropTablesQuery = `SELECT 'DROP TABLE "' || TABLE_NAME || '" CASCADE CONSTRAINTS' AS "query" FROM "USER_TABLES"`;
            const dropTableQueries: ObjectLiteral[] = await this.query(dropTablesQuery);
            await Promise.all(dropTableQueries.map(query => this.query(query["query"])));
            if (!isAnotherTransactionActive) await this.commitTransaction()

        } catch (error) {
            try { // we throw original error even if rollback thrown an error
                if (!isAnotherTransactionActive) await this.rollbackTransaction()
            } catch (rollbackError) { }
            throw error;
        }

    }

    // 加载视图
    protected async loadViews(viewNames?: string[]): Promise<View[]> {
        this.log('loadViews','start')
        const hasTable = await this.hasTable(this.getTypeormMetadataTableName());
        if (!hasTable) return []
        if (!viewNames) viewNames = []

        const currentDatabase = await this.getCurrentDatabase();
        const currentSchema = await this.getCurrentSchema();

        const viewNamesString = viewNames.map(name => "'" + name + "'").join(", ");
        let query = `SELECT "T".* FROM ${this.escapePath(this.getTypeormMetadataTableName())} "T" ` +
            `INNER JOIN "USER_OBJECTS" "O" ON "O"."OBJECT_NAME" = "T"."name" AND "O"."OBJECT_TYPE" IN ( 'MATERIALIZED VIEW', 'VIEW' ) ` +
            `WHERE "T"."type" IN ( '${MetadataTableType.MATERIALIZED_VIEW}', '${MetadataTableType.VIEW}' )`;
        if (viewNamesString.length > 0)
            query += ` AND "T"."name" IN (${viewNamesString})`;
        const dbViews = await this.query(query);
        return dbViews.map((dbView: any) => {
            const parsedName = this.driver.parseTableName(dbView["name"]);

            const view = new View();
            view.database = parsedName.database || dbView["database"] || currentDatabase;
            view.schema = parsedName.schema || dbView["schema"] || currentSchema;
            view.name = parsedName.tableName;
            view.expression = dbView["value"];
            view.materialized = dbView["type"] === MetadataTableType.MATERIALIZED_VIEW;
            return view;
        });
    }

    // // 加载表
    // protected async loadTables(tableNames?: string[]): Promise<Table[]> {
    //     this.log('loadTables','start')
    //     if (tableNames && tableNames.length === 0) return []

    //     const dbTables: { TABLE_NAME: string, OWNER: string }[] = []
    //     const currentSchema = await this.getCurrentSchema();
    //     const currentDatabase = await this.getCurrentDatabase();

    //     if (!tableNames) {
    //         const tablesSql = `SELECT "TABLE_NAME", "OWNER" FROM "ALL_TABLES"`;
    //         dbTables.push(...await this.query(tablesSql));
    //     } else {
    //         const tablesCondition = tableNames.map(tableName => {
    //             const parts = tableName.split(".");

    //             if (parts.length >= 3) {
    //                 const [ , schema, name ] = parts;
    //                 return `("OWNER" = '${schema}' AND "TABLE_NAME" = '${name}')`
    //             } else if (parts.length === 2) {
    //                 const [ schema, name ] = parts;
    //                 return `("OWNER" = '${schema}' AND "TABLE_NAME" = '${name}')`
    //             } else if (parts.length === 1) {
    //                 const [ name ] = parts;
    //                 return `("TABLE_NAME" = '${name}')`
    //             } else {
    //                 return `(1=0)`
    //             }
    //         }).join(" OR ");
    //         const tablesSql = `SELECT "TABLE_NAME", "OWNER" FROM "ALL_TABLES" WHERE ${tablesCondition}`;
    //         dbTables.push(...await this.query(tablesSql));
    //     }

    //     // if tables were not found in the db, no need to proceed
    //     if (dbTables.length === 0) return []

    //     // load tables, columns, indices and foreign keys
    //     const columnsCondition = dbTables.map(({ TABLE_NAME, OWNER }) => {
    //         return `("C"."OWNER" = '${OWNER}' AND "C"."TABLE_NAME" = '${TABLE_NAME}')`;
    //     }).join(" OR ");
    //     const columnsSql = `SELECT * FROM "ALL_TAB_COLS" "C" WHERE (${columnsCondition})`;

    //     const indicesSql = `SELECT "C"."INDEX_NAME", "C"."OWNER", "C"."TABLE_NAME", "C"."UNIQUENESS", ` +
    //         `LISTAGG ("COL"."COLUMN_NAME", ',') WITHIN GROUP (ORDER BY "COL"."COLUMN_NAME") AS "COLUMN_NAMES" ` +
    //         `FROM "ALL_INDEXES" "C" ` +
    //         `INNER JOIN "ALL_IND_COLUMNS" "COL" ON "COL"."INDEX_OWNER" = "C"."OWNER" AND "COL"."INDEX_NAME" = "C"."INDEX_NAME" ` +
    //         `LEFT JOIN "ALL_CONSTRAINTS" "CON" ON "CON"."OWNER" = "C"."OWNER" AND "CON"."CONSTRAINT_NAME" = "C"."INDEX_NAME" ` +
    //         `WHERE (${columnsCondition}) AND "CON"."CONSTRAINT_NAME" IS NULL ` +
    //         `GROUP BY "C"."INDEX_NAME", "C"."OWNER", "C"."TABLE_NAME", "C"."UNIQUENESS"`;


    //     const foreignKeysSql = `SELECT "C"."CONSTRAINT_NAME", "C"."OWNER", "C"."TABLE_NAME", "COL"."COLUMN_NAME", "REF_COL"."TABLE_NAME" AS "REFERENCED_TABLE_NAME", ` +
    //         `"REF_COL"."COLUMN_NAME" AS "REFERENCED_COLUMN_NAME", "C"."DELETE_RULE" AS "ON_DELETE" ` +
    //         `FROM "ALL_CONSTRAINTS" "C" ` +
    //         `INNER JOIN "ALL_CONS_COLUMNS" "COL" ON "COL"."OWNER" = "C"."OWNER" AND "COL"."CONSTRAINT_NAME" = "C"."CONSTRAINT_NAME" ` +
    //         `INNER JOIN "ALL_CONS_COLUMNS" "REF_COL" ON "REF_COL"."OWNER" = "C"."R_OWNER" AND "REF_COL"."CONSTRAINT_NAME" = "C"."R_CONSTRAINT_NAME" AND "REF_COL"."POSITION" = "COL"."POSITION" ` +
    //         `WHERE (${columnsCondition}) AND "C"."CONSTRAINT_TYPE" = 'R'`;

    //     const constraintsSql = `SELECT "C"."CONSTRAINT_NAME", "C"."CONSTRAINT_TYPE", "C"."OWNER", "C"."TABLE_NAME", "COL"."COLUMN_NAME", "C"."SEARCH_CONDITION" ` +
    //         `FROM "ALL_CONSTRAINTS" "C" ` +
    //         `INNER JOIN "ALL_CONS_COLUMNS" "COL" ON "COL"."OWNER" = "C"."OWNER" AND "COL"."CONSTRAINT_NAME" = "C"."CONSTRAINT_NAME" ` +
    //         `WHERE (${columnsCondition}) AND "C"."CONSTRAINT_TYPE" IN ('C', 'U', 'P') AND "C"."GENERATED" = 'USER NAME'`;

    //     const [dbColumns, dbIndices, dbForeignKeys, dbConstraints]: ObjectLiteral[][] = await Promise.all([
    //         this.query(columnsSql),
    //         this.query(indicesSql),
    //         this.query(foreignKeysSql),
    //         this.query(constraintsSql),
    //     ]);

    //     // create tables for loaded tables
    //     return await Promise.all(dbTables.map(async dbTable => {
    //         const table = new Table();
    //         const owner = dbTable["OWNER"] === currentSchema && (!this.driver.options.schema || this.driver.options.schema === currentSchema) ? undefined : dbTable["OWNER"];
    //         table.database = currentDatabase;
    //         table.schema = dbTable["OWNER"];
    //         table.name = this.driver.buildTableName(dbTable["TABLE_NAME"], owner);

    //         // create columns from the loaded columns
    //         table.columns = await Promise.all(dbColumns
    //             .filter(
    //                 dbColumn => (
    //                     dbColumn["OWNER"] === dbTable["OWNER"] &&
    //                     dbColumn["TABLE_NAME"] === dbTable["TABLE_NAME"]
    //                 )
    //             )
    //             .map(async dbColumn => {
    //                 const columnConstraints = dbConstraints.filter(
    //                     dbConstraint => (
    //                         dbConstraint["OWNER"] === dbColumn["OWNER"] &&
    //                         dbConstraint["TABLE_NAME"] === dbColumn["TABLE_NAME"] &&
    //                         dbConstraint["COLUMN_NAME"] === dbColumn["COLUMN_NAME"]
    //                     )
    //                 );

    //                 const uniqueConstraints = columnConstraints.filter(constraint => constraint["CONSTRAINT_TYPE"] === "U");
    //                 const isConstraintComposite = uniqueConstraints.every((uniqueConstraint) => {
    //                     return dbConstraints.some(dbConstraint => (
    //                         dbConstraint["OWNER"] === dbColumn["OWNER"] &&
    //                         dbConstraint["TABLE_NAME"] === dbColumn["TABLE_NAME"] &&
    //                         dbConstraint["COLUMN_NAME"] !== dbColumn["COLUMN_NAME"] &&
    //                         dbConstraint["CONSTRAINT_NAME"] === uniqueConstraint["CONSTRAINT_NAME"] &&
    //                         dbConstraint["CONSTRAINT_TYPE"] === "U")
    //                     )
    //                 })

    //                 const tableColumn = new TableColumn();
    //                 tableColumn.name = dbColumn["COLUMN_NAME"];
    //                 tableColumn.type = dbColumn["DATA_TYPE"].toLowerCase();
    //                 if (tableColumn.type.indexOf("(") !== -1)
    //                     tableColumn.type = tableColumn.type.replace(/\([0-9]*\)/, "");

    //                 // check only columns that have length property
    //                 if (this.driver.withLengthColumnTypes.indexOf(tableColumn.type as ColumnType) !== -1) {
    //                     const length = tableColumn.type === "raw" ? dbColumn["DATA_LENGTH"] : dbColumn["CHAR_COL_DECL_LENGTH"];
    //                     tableColumn.length = length && !this.isDefaultColumnLength(table, tableColumn, length) ? length.toString() : "";
    //                 }

    //                 if (tableColumn.type === "number" || tableColumn.type === "float") {
    //                     if (dbColumn["DATA_PRECISION"] !== null && !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["DATA_PRECISION"]))
    //                         tableColumn.precision = dbColumn["DATA_PRECISION"];
    //                     if (dbColumn["DATA_SCALE"] !== null && !this.isDefaultColumnScale(table, tableColumn, dbColumn["DATA_SCALE"]))
    //                         tableColumn.scale = dbColumn["DATA_SCALE"];

    //                 } else if ((tableColumn.type === "timestamp"
    //                     || tableColumn.type === "timestamp with time zone"
    //                     || tableColumn.type === "timestamp with local time zone") && dbColumn["DATA_SCALE"] !== null) {
    //                     tableColumn.precision = !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["DATA_SCALE"]) ? dbColumn["DATA_SCALE"] : undefined;
    //                 }

    //                 tableColumn.default = dbColumn["DATA_DEFAULT"] !== null
    //                     && dbColumn["DATA_DEFAULT"] !== undefined
    //                     && dbColumn["DATA_DEFAULT"].trim() !== "NULL" ? tableColumn.default = dbColumn["DATA_DEFAULT"].trim() : undefined;

    //                 const primaryConstraint = columnConstraints.find((constraint) => constraint["CONSTRAINT_TYPE"] === "P");
    //                 if (primaryConstraint) {
    //                     tableColumn.isPrimary = true;
    //                     // find another columns involved in primary key constraint
    //                     const anotherPrimaryConstraints = dbConstraints.filter((constraint) => 
    //                         constraint["OWNER"] === dbColumn["OWNER"] &&
    //                         constraint["TABLE_NAME"] === dbColumn["TABLE_NAME"] &&
    //                         constraint["COLUMN_NAME"] !== dbColumn["COLUMN_NAME"] &&
    //                         constraint["CONSTRAINT_TYPE"] === "P");
    //                     // collect all column names
    //                     const columnNames = anotherPrimaryConstraints.map((constraint) => constraint["COLUMN_NAME"]);
    //                     columnNames.push(dbColumn["COLUMN_NAME"]);
    //                     // build default primary key constraint name
    //                     const pkName = this.connection.namingStrategy.primaryKeyName(table, columnNames);
    //                     // if primary key has user-defined constraint name, write it in table column
    //                     if (primaryConstraint["CONSTRAINT_NAME"] !== pkName) {
    //                         tableColumn.primaryKeyConstraintName = primaryConstraint["CONSTRAINT_NAME"];
    //                     }
    //                 }

    //                 tableColumn.isNullable = dbColumn["NULLABLE"] === "Y";
    //                 tableColumn.isUnique = uniqueConstraints.length > 0 && !isConstraintComposite;
    //                 // tableColumn.isPrimary = isPrimary;
    //                 tableColumn.isGenerated = dbColumn["IDENTITY_COLUMN"] === "YES";
    //                 if (tableColumn.isGenerated) {
    //                     tableColumn.generationStrategy = "increment";
    //                     tableColumn.default = undefined;
    //                 }
    //                 tableColumn.comment = ""; // todo
    //                 if (dbColumn["VIRTUAL_COLUMN"] === "YES") {
    //                     tableColumn.generatedType = "VIRTUAL";
    //                     const asExpressionQuery = await this.selectTypeormMetadataSql({
    //                         table: dbTable["TABLE_NAME"],
    //                         type: MetadataTableType.GENERATED_COLUMN,
    //                         name: tableColumn.name,
    //                     });
    //                     const results = await this.query(asExpressionQuery.query, asExpressionQuery.parameters);
    //                     if (results[0] && results[0].value) {
    //                         tableColumn.asExpression = results[0].value;
    //                     }
    //                     else {
    //                         tableColumn.asExpression = "";
    //                     }
    //                 }
    //                 return tableColumn;
    //             }))

    //         // find unique constraints of table, group them by constraint name and build TableUnique.
    //         const tableUniqueConstraints = OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
    //             return (
    //                 dbConstraint["TABLE_NAME"] === dbTable["TABLE_NAME"] &&
    //                 dbConstraint["OWNER"] === dbTable["OWNER"] &&
    //                 dbConstraint["CONSTRAINT_TYPE"] === "U"
    //             );
    //         }), dbConstraint => dbConstraint["CONSTRAINT_NAME"]);

    //         table.uniques = tableUniqueConstraints.map(constraint => {
    //             const uniques = dbConstraints.filter(dbC => dbC["CONSTRAINT_NAME"] === constraint["CONSTRAINT_NAME"]);
    //             return new TableUnique({
    //                 name: constraint["CONSTRAINT_NAME"],
    //                 columnNames: uniques.map(u => u["COLUMN_NAME"])
    //             });
    //         });

    //         // find check constraints of table, group them by constraint name and build TableCheck.
    //         const tableCheckConstraints = OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
    //             return (
    //                 dbConstraint["TABLE_NAME"] === dbTable["TABLE_NAME"] &&
    //                 dbConstraint["OWNER"] === dbTable["OWNER"] &&
    //                 dbConstraint["CONSTRAINT_TYPE"] === "C");
    //         }), dbConstraint => dbConstraint["CONSTRAINT_NAME"]);

    //         table.checks = tableCheckConstraints.map(constraint => {
    //             const checks = dbConstraints.filter(
    //                 dbC => (
    //                     dbC["TABLE_NAME"] === constraint["TABLE_NAME"] &&
    //                     dbC["OWNER"] === constraint["OWNER"] &&
    //                     dbC["CONSTRAINT_NAME"] === constraint["CONSTRAINT_NAME"]
    //                 )
    //             );
    //             return new TableCheck({
    //                 name: constraint["CONSTRAINT_NAME"],
    //                 columnNames: checks.map(c => c["COLUMN_NAME"]),
    //                 expression: constraint["SEARCH_CONDITION"]
    //             });
    //         });

    //         // find foreign key constraints of table, group them by constraint name and build TableForeignKey.
    //         const tableForeignKeyConstraints = OrmUtils.uniq(dbForeignKeys.filter(dbForeignKey => (
    //             dbForeignKey["OWNER"] === dbTable["OWNER"] &&
    //             dbForeignKey["TABLE_NAME"] === dbTable["TABLE_NAME"]
    //         )), dbForeignKey => dbForeignKey["CONSTRAINT_NAME"]);

    //         table.foreignKeys = tableForeignKeyConstraints.map(dbForeignKey => {
    //             const foreignKeys = dbForeignKeys.filter(dbFk => (
    //                 dbFk["TABLE_NAME"] === dbForeignKey["TABLE_NAME"] &&
    //                 dbFk["OWNER"] === dbForeignKey["OWNER"] &&
    //                 dbFk["CONSTRAINT_NAME"] === dbForeignKey["CONSTRAINT_NAME"]
    //             ));
    //             return new TableForeignKey({
    //                 name: dbForeignKey["CONSTRAINT_NAME"],
    //                 columnNames: foreignKeys.map(dbFk => dbFk["COLUMN_NAME"]),
    //                 referencedDatabase: table.database,
    //                 referencedSchema: dbForeignKey["OWNER"],
    //                 referencedTableName: dbForeignKey["REFERENCED_TABLE_NAME"],
    //                 referencedColumnNames: foreignKeys.map(dbFk => dbFk["REFERENCED_COLUMN_NAME"]),
    //                 onDelete: dbForeignKey["ON_DELETE"],
    //                 onUpdate: "NO ACTION", // Dmdb does not have onUpdate option in FK's, but we need it for proper synchronization
    //             });
    //         });

    //         // create TableIndex objects from the loaded indices
    //         table.indices = dbIndices
    //             .filter(dbIndex => dbIndex["TABLE_NAME"] === dbTable["TABLE_NAME"] && dbIndex["OWNER"] === dbTable["OWNER"])
    //             .map(dbIndex => {
    //                 return new TableIndex({
    //                     name: dbIndex["INDEX_NAME"],
    //                     columnNames: dbIndex["COLUMN_NAMES"].split(","),
    //                     isUnique: dbIndex["UNIQUENESS"] === "UNIQUE"
    //                 });
    //             });

    //         return table;
    //     }))
    // }
    protected async loadTables(tableNames?: string[]): Promise<Table[]> {
        if (tableNames && tableNames.length === 0) {
            return [];
        }

        const dbTables: { TABLE_NAME: string, OWNER: string }[] = []

        const currentSchema = await this.getCurrentSchema();
        const currentDatabase = await this.getCurrentDatabase();

        if (!tableNames) {
            const tablesSql = `SELECT "TABLE_NAME", "OWNER" FROM "ALL_TABLES"`;
            dbTables.push(...await this.query(tablesSql));
        } else {
            const tablesCondition = tableNames.map(tableName => {
                const parts = tableName.split(".");

                if (parts.length >= 3) {
                    const [ , schema, name ] = parts;
                    return `("OWNER" = '${schema}' AND "TABLE_NAME" = '${name}')`
                } else if (parts.length === 2) {
                    const [ schema, name ] = parts;
                    return `("OWNER" = '${schema}' AND "TABLE_NAME" = '${name}')`
                } else if (parts.length === 1) {
                    const [ name ] = parts;
                    return `("TABLE_NAME" = '${name}')`
                } else {
                    return `(1=0)`
                }
            }).join(" OR ");
            const tablesSql = `SELECT "TABLE_NAME", "OWNER" FROM "ALL_TABLES" WHERE ${tablesCondition}`;
            dbTables.push(...await this.query(tablesSql));
        }

        // if tables were not found in the db, no need to proceed
        if (dbTables.length === 0) {
            return [];
        }

        // load tables, columns, indices and foreign keys
        const columnsCondition = dbTables.map(({ TABLE_NAME, OWNER }) => {
            return `("C"."OWNER" = '${OWNER}' AND "C"."TABLE_NAME" = '${TABLE_NAME}')`;
        }).join(" OR ");
        const columnsSql = `SELECT * FROM "ALL_TAB_COLS" "C" WHERE (${columnsCondition})`;

        const indicesSql = `SELECT "C"."INDEX_NAME", "C"."OWNER", "C"."TABLE_NAME", "C"."UNIQUENESS", ` +
            `LISTAGG ("COL"."COLUMN_NAME", ',') WITHIN GROUP (ORDER BY "COL"."COLUMN_NAME") AS "COLUMN_NAMES" ` +
            `FROM "ALL_INDEXES" "C" ` +
            `INNER JOIN "ALL_IND_COLUMNS" "COL" ON "COL"."INDEX_OWNER" = "C"."OWNER" AND "COL"."INDEX_NAME" = "C"."INDEX_NAME" ` +
            `LEFT JOIN "ALL_CONSTRAINTS" "CON" ON "CON"."OWNER" = "C"."OWNER" AND "CON"."CONSTRAINT_NAME" = "C"."INDEX_NAME" ` +
            `WHERE (${columnsCondition}) AND "CON"."CONSTRAINT_NAME" IS NULL ` +
            `GROUP BY "C"."INDEX_NAME", "C"."OWNER", "C"."TABLE_NAME", "C"."UNIQUENESS"`;


        const foreignKeysSql = `SELECT "C"."CONSTRAINT_NAME", "C"."OWNER", "C"."TABLE_NAME", "COL"."COLUMN_NAME", "REF_COL"."TABLE_NAME" AS "REFERENCED_TABLE_NAME", ` +
            `"REF_COL"."COLUMN_NAME" AS "REFERENCED_COLUMN_NAME", "C"."DELETE_RULE" AS "ON_DELETE" ` +
            `FROM "ALL_CONSTRAINTS" "C" ` +
            `INNER JOIN "ALL_CONS_COLUMNS" "COL" ON "COL"."OWNER" = "C"."OWNER" AND "COL"."CONSTRAINT_NAME" = "C"."CONSTRAINT_NAME" ` +
            `INNER JOIN "ALL_CONS_COLUMNS" "REF_COL" ON "REF_COL"."OWNER" = "C"."R_OWNER" AND "REF_COL"."CONSTRAINT_NAME" = "C"."R_CONSTRAINT_NAME" AND "REF_COL"."POSITION" = "COL"."POSITION" ` +
            `WHERE (${columnsCondition}) AND "C"."CONSTRAINT_TYPE" = 'R'`;

        const constraintsSql = `SELECT "C"."CONSTRAINT_NAME", "C"."CONSTRAINT_TYPE", "C"."OWNER", "C"."TABLE_NAME", "COL"."COLUMN_NAME", "C"."SEARCH_CONDITION" ` +
            `FROM "ALL_CONSTRAINTS" "C" ` +
            `INNER JOIN "ALL_CONS_COLUMNS" "COL" ON "COL"."OWNER" = "C"."OWNER" AND "COL"."CONSTRAINT_NAME" = "C"."CONSTRAINT_NAME" ` +
            `WHERE (${columnsCondition}) AND "C"."CONSTRAINT_TYPE" IN ('C', 'U', 'P') AND "C"."GENERATED" = 'USER NAME'`;

        const [dbColumns, dbIndices, dbForeignKeys, dbConstraints]: ObjectLiteral[][] = await Promise.all([
            this.query(columnsSql),
            this.query(indicesSql),
            this.query(foreignKeysSql),
            this.query(constraintsSql),
        ]);

        // create tables for loaded tables
        return dbTables.map(dbTable => {
            const table = new Table();
            const owner = dbTable["OWNER"] === currentSchema && (!this.driver.options.schema || this.driver.options.schema === currentSchema) ? undefined : dbTable["OWNER"];
            table.database = currentDatabase;
            table.schema = dbTable["OWNER"];
            table.name = this.driver.buildTableName(dbTable["TABLE_NAME"], owner);

            // create columns from the loaded columns
            table.columns = dbColumns
                .filter(
                    dbColumn => (
                        dbColumn["OWNER"] === dbTable["OWNER"] &&
                        dbColumn["TABLE_NAME"] === dbTable["TABLE_NAME"]
                    )
                )
                .map(dbColumn => {
                    const columnConstraints = dbConstraints.filter(
                        dbConstraint => (
                            dbConstraint["OWNER"] === dbColumn["OWNER"] &&
                            dbConstraint["TABLE_NAME"] === dbColumn["TABLE_NAME"] &&
                            dbConstraint["COLUMN_NAME"] === dbColumn["COLUMN_NAME"]
                        )
                    );

                    const uniqueConstraints = columnConstraints.filter(constraint => constraint["CONSTRAINT_TYPE"] === "U");
                    const isConstraintComposite = uniqueConstraints.every((uniqueConstraint) => {
                        return dbConstraints.some(dbConstraint => (
                            dbConstraint["OWNER"] === dbColumn["OWNER"] &&
                            dbConstraint["TABLE_NAME"] === dbColumn["TABLE_NAME"] &&
                            dbConstraint["COLUMN_NAME"] !== dbColumn["COLUMN_NAME"] &&
                            dbConstraint["CONSTRAINT_NAME"] === uniqueConstraint["CONSTRAINT_NAME"] &&
                            dbConstraint["CONSTRAINT_TYPE"] === "U")
                        )
                    })

                    const isPrimary = !!columnConstraints.find(constraint =>  constraint["CONSTRAINT_TYPE"] === "P");

                    const tableColumn = new TableColumn();
                    tableColumn.name = dbColumn["COLUMN_NAME"];
                    tableColumn.type = dbColumn["DATA_TYPE"].toLowerCase();
                    if (tableColumn.type.indexOf("(") !== -1)
                        tableColumn.type = tableColumn.type.replace(/\([0-9]*\)/, "");

                    // check only columns that have length property
                    if (this.driver.withLengthColumnTypes.indexOf(tableColumn.type as ColumnType) !== -1) {
                        const length = tableColumn.type === "raw" ? dbColumn["DATA_LENGTH"] : dbColumn["CHAR_COL_DECL_LENGTH"];
                        tableColumn.length = length && !this.isDefaultColumnLength(table, tableColumn, length) ? length.toString() : "";
                    }

                    if (tableColumn.type === "number" || tableColumn.type === "float") {
                        if (dbColumn["DATA_PRECISION"] !== null && !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["DATA_PRECISION"]))
                            tableColumn.precision = dbColumn["DATA_PRECISION"];
                        if (dbColumn["DATA_SCALE"] !== null && !this.isDefaultColumnScale(table, tableColumn, dbColumn["DATA_SCALE"]))
                            tableColumn.scale = dbColumn["DATA_SCALE"];

                    } else if ((tableColumn.type === "timestamp"
                        || tableColumn.type === "timestamp with time zone"
                        || tableColumn.type === "timestamp with local time zone") && dbColumn["DATA_SCALE"] !== null) {
                        tableColumn.precision = !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["DATA_SCALE"]) ? dbColumn["DATA_SCALE"] : undefined;
                    }

                    tableColumn.default = dbColumn["DATA_DEFAULT"] !== null
                        && dbColumn["DATA_DEFAULT"] !== undefined
                        && dbColumn["DATA_DEFAULT"].trim() !== "NULL" ? tableColumn.default = dbColumn["DATA_DEFAULT"].trim() : undefined;

                    tableColumn.isNullable = dbColumn["NULLABLE"] === "Y";
                    tableColumn.isUnique = uniqueConstraints.length > 0 && !isConstraintComposite;
                    tableColumn.isPrimary = isPrimary;
                    tableColumn.isGenerated = dbColumn["IDENTITY_COLUMN"] === "YES";
                    if (tableColumn.isGenerated) {
                        tableColumn.generationStrategy = "increment";
                        tableColumn.default = undefined;
                    }
                    tableColumn.comment = ""; // todo
                    return tableColumn;
                });

            // find unique constraints of table, group them by constraint name and build TableUnique.
            const tableUniqueConstraints = OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
                return (
                    dbConstraint["TABLE_NAME"] === dbTable["TABLE_NAME"] &&
                    dbConstraint["OWNER"] === dbTable["OWNER"] &&
                    dbConstraint["CONSTRAINT_TYPE"] === "U"
                );
            }), dbConstraint => dbConstraint["CONSTRAINT_NAME"]);

            table.uniques = tableUniqueConstraints.map(constraint => {
                const uniques = dbConstraints.filter(dbC => dbC["CONSTRAINT_NAME"] === constraint["CONSTRAINT_NAME"]);
                return new TableUnique({
                    name: constraint["CONSTRAINT_NAME"],
                    columnNames: uniques.map(u => u["COLUMN_NAME"])
                });
            });

            // find check constraints of table, group them by constraint name and build TableCheck.
            const tableCheckConstraints = OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
                return (
                    dbConstraint["TABLE_NAME"] === dbTable["TABLE_NAME"] &&
                    dbConstraint["OWNER"] === dbTable["OWNER"] &&
                    dbConstraint["CONSTRAINT_TYPE"] === "C");
            }), dbConstraint => dbConstraint["CONSTRAINT_NAME"]);

            table.checks = tableCheckConstraints.map(constraint => {
                const checks = dbConstraints.filter(
                    dbC => (
                        dbC["TABLE_NAME"] === constraint["TABLE_NAME"] &&
                        dbC["OWNER"] === constraint["OWNER"] &&
                        dbC["CONSTRAINT_NAME"] === constraint["CONSTRAINT_NAME"]
                    )
                );
                return new TableCheck({
                    name: constraint["CONSTRAINT_NAME"],
                    columnNames: checks.map(c => c["COLUMN_NAME"]),
                    expression: constraint["SEARCH_CONDITION"]
                });
            });

            // find foreign key constraints of table, group them by constraint name and build TableForeignKey.
            const tableForeignKeyConstraints = OrmUtils.uniq(dbForeignKeys.filter(dbForeignKey => (
                dbForeignKey["OWNER"] === dbTable["OWNER"] &&
                dbForeignKey["TABLE_NAME"] === dbTable["TABLE_NAME"]
            )), dbForeignKey => dbForeignKey["CONSTRAINT_NAME"]);

            table.foreignKeys = tableForeignKeyConstraints.map(dbForeignKey => {
                const foreignKeys = dbForeignKeys.filter(dbFk => (
                    dbFk["TABLE_NAME"] === dbForeignKey["TABLE_NAME"] &&
                    dbFk["OWNER"] === dbForeignKey["OWNER"] &&
                    dbFk["CONSTRAINT_NAME"] === dbForeignKey["CONSTRAINT_NAME"]
                ));
                return new TableForeignKey({
                    name: dbForeignKey["CONSTRAINT_NAME"],
                    columnNames: foreignKeys.map(dbFk => dbFk["COLUMN_NAME"]),
                    referencedDatabase: table.database,
                    referencedSchema: dbForeignKey["OWNER"],
                    referencedTableName: dbForeignKey["REFERENCED_TABLE_NAME"],
                    referencedColumnNames: foreignKeys.map(dbFk => dbFk["REFERENCED_COLUMN_NAME"]),
                    onDelete: dbForeignKey["ON_DELETE"],
                    onUpdate: "NO ACTION", // Oracle does not have onUpdate option in FK's, but we need it for proper synchronization
                });
            });

            // create TableIndex objects from the loaded indices
            table.indices = dbIndices
                .filter(dbIndex => dbIndex["TABLE_NAME"] === dbTable["TABLE_NAME"] && dbIndex["OWNER"] === dbTable["OWNER"])
                .map(dbIndex => {
                    return new TableIndex({
                        name: dbIndex["INDEX_NAME"],
                        columnNames: dbIndex["COLUMN_NAMES"].split(","),
                        isUnique: dbIndex["UNIQUENESS"] === "UNIQUE"
                    });
                });

            return table;
        });
    }

    // 构造建表sql
    protected createTableSql(table: Table, createForeignKeys?: boolean): Query {
        this.log('createTableSql','start')
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column)).join(", ");
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
                if (fk.onDelete && fk.onDelete !== "NO ACTION") // Dmdb does not support NO ACTION, but we set NO ACTION by default in EntityMetadata
                    constraint += ` ON DELETE ${fk.onDelete}`;

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

        return new Query(sql);
    }

    // 构造删表sql
    protected dropTableSql(tableOrName: Table|string, ifExist?: boolean): Query {
        this.log('dropTableSql','start')
        const query = ifExist ? `DROP TABLE IF EXISTS ${this.escapePath(tableOrName)}` : `DROP TABLE ${this.escapePath(tableOrName)}`;
        return new Query(query);
    }

    // 构造建视图sql
    protected createViewSql(view: View): Query {
        this.log('createViewSql','start')
        const materializedClause = view.materialized ? "MATERIALIZED " : "";
        if (typeof view.expression === "string") {
            return new Query(`CREATE ${materializedClause}VIEW ${this.escapePath(view)} AS ${view.expression}`);
        } else {
            return new Query(`CREATE ${materializedClause}VIEW ${this.escapePath(view)} AS ${view.expression(this.connection).getQuery()}`);
        }
    }

    // 构造建视图sql
    protected insertViewDefinitionSql(view: View): Query {
        this.log('insertViewDefinitionSql','start')
        const expression = typeof view.expression === "string" ? view.expression.trim() : view.expression(this.connection).getQuery();
        const type = view.materialized ? MetadataTableType.MATERIALIZED_VIEW : MetadataTableType.VIEW;
        return this.insertTypeormMetadataSql({ type: type, name: view.name, value: expression });
    }

    // 构造删视图sql
    protected dropViewSql(view: View): Query {
        this.log('dropViewSql','start')
        const materializedClause = view.materialized ? "MATERIALIZED " : "";
        return new Query(`DROP ${materializedClause}VIEW ${this.escapePath(view)}`);
    }

    // 构造删视图sql
    protected deleteViewDefinitionSql(view: View): Query {
        this.log('deleteViewDefinitionSql','start')
        const type = view.materialized ? MetadataTableType.MATERIALIZED_VIEW : MetadataTableType.VIEW;
        return this.deleteTypeormMetadataSql({ type, name: view.name });
    }

    // 构造建索引sql
    protected createIndexSql(table: Table, index: TableIndex): Query {
        this.log('createIndexSql','start')
        const columns = index.columnNames.map(columnName => `"${columnName}"`).join(", ");
        return new Query(`CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${index.name}" ON ${this.escapePath(table)} (${columns})`);
    }

    // 构造删索引sql
    protected dropIndexSql(indexOrName: TableIndex|string): Query {
        this.log('dropIndexSql','start')
        let indexName = indexOrName instanceof TableIndex ? indexOrName.name : indexOrName;
        return new Query(`DROP INDEX "${indexName}"`);
    }

    // 构造建主键sql
    protected createPrimaryKeySql(table: Table, columnNames: string[], constraintName?: string): Query {
        this.log('createPrimaryKeySql','start')
        const primaryKeyName = constraintName ? constraintName
        : this.connection.namingStrategy.primaryKeyName(table, columnNames);
        const columnNamesString = columnNames.map(columnName => `"${columnName}"`).join(", ");
        return new Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${primaryKeyName}" PRIMARY KEY (${columnNamesString})`);
    }

    // 构造删主键sql
    protected dropPrimaryKeySql(table: Table): Query {
        this.log('dropPrimaryKeySql','start')
        const columnNames = table.primaryColumns.map(column => column.name);
        const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table, columnNames);
        return new Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${primaryKeyName}"`);
    }

    // 构造建唯一约束sql
    protected createUniqueConstraintSql(table: Table, uniqueConstraint: TableUnique): Query {
        this.log('createUniqueConstraintSql','start')
        const columnNames = uniqueConstraint.columnNames.map(column => `"` + column + `"`).join(", ");
        return new Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE (${columnNames})`);
    }

    // 构造删唯一约束sql
    protected dropUniqueConstraintSql(table: Table, uniqueOrName: TableUnique|string): Query {
        this.log('dropUniqueConstraintSql','start')
        const uniqueName = uniqueOrName instanceof TableUnique ? uniqueOrName.name : uniqueOrName;
        return new Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${uniqueName}"`);
    }

    // 构造建检查约束sql
    protected createCheckConstraintSql(table: Table, checkConstraint: TableCheck): Query {
        this.log('createCheckConstraintSql','start')
        return new Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${checkConstraint.name}" CHECK (${checkConstraint.expression})`);
    }

    // 构造删检查约束sql
    protected dropCheckConstraintSql(table: Table, checkOrName: TableCheck|string): Query {
        const checkName = checkOrName instanceof TableCheck ? checkOrName.name : checkOrName;
        return new Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${checkName}"`);
    }

    // 构造建外键sql
    protected createForeignKeySql(table: Table, foreignKey: TableForeignKey): Query {
        this.log('createForeignKeySql','start')
        const columnNames = foreignKey.columnNames.map(column => `"` + column + `"`).join(", ");
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `"` + column + `"`).join(",");
        let sql = `ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${foreignKey.name}" FOREIGN KEY (${columnNames}) ` +
            `REFERENCES ${this.escapePath(this.getTablePath(foreignKey))} (${referencedColumnNames})`;
        // Dmdb does not support NO ACTION, but we set NO ACTION by default in EntityMetadata
        if (foreignKey.onDelete && foreignKey.onDelete !== "NO ACTION")
            sql += ` ON DELETE ${foreignKey.onDelete}`;

        return new Query(sql);
    }

    // 构造删外键sql
    protected dropForeignKeySql(table: Table, foreignKeyOrName: TableForeignKey|string): Query {
        this.log('dropForeignKeySql','start')
        const foreignKeyName = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName.name : foreignKeyOrName;
        return new Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${foreignKeyName}"`);
    }

    // 构造增列sql
    protected buildCreateColumnSql(column: TableColumn) {
        this.log('buildCreateColumnSql','start')
        let c = `"${column.name}" ` + this.connection.driver.createFullType(column);
        if (column.charset)
            c += " CHARACTER SET " + column.charset;
        if (column.collation)
            c += " COLLATE " + column.collation;
        if (column.asExpression)
            c += ` AS (${column.asExpression}) VIRTUAL`;
        if (column.default !== undefined && column.default !== null) // DEFAULT must be placed before NOT NULL
            c += " DEFAULT " + column.default;
        if (column.isNullable !== true && !column.isGenerated) // NOT NULL is not supported with GENERATED
            c += " NOT NULL";
        if (column.isGenerated === true && column.generationStrategy === "increment")
            c += " IDENTITY";

        return c;
    }

    // 获取表或视图路径
    protected escapePath(target: Table | View | string): string {
        this.log('escapePath','start')
        // Ignore database when escaping paths
        const { schema, tableName } = this.driver.parseTableName(target);

        if (schema && schema !== this.driver.schema) {
            return `"${schema}"."${tableName}"`;
        }

        return `"${tableName}"`;
    }
}
