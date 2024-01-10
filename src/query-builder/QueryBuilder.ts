import {ObjectLiteral} from "../common/ObjectLiteral";
import {QueryRunner} from "../query-runner/QueryRunner";
import {Connection} from "../connection/Connection";
import {QueryExpressionMap} from "./QueryExpressionMap";
import {SelectQueryBuilder} from "./SelectQueryBuilder";
import {UpdateQueryBuilder} from "./UpdateQueryBuilder";
import {DeleteQueryBuilder} from "./DeleteQueryBuilder";
import {SoftDeleteQueryBuilder} from "./SoftDeleteQueryBuilder";
import {InsertQueryBuilder} from "./InsertQueryBuilder";
import {RelationQueryBuilder} from "./RelationQueryBuilder";
import {EntityTarget} from "../common/EntityTarget";
import {Alias} from "./Alias";
import {Brackets} from "./Brackets";
import {QueryDeepPartialEntity} from "./QueryPartialEntity";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {PostgresDriver} from "../driver/postgres/PostgresDriver";
import {CockroachDriver} from "../driver/cockroachdb/CockroachDriver";
import {SqlServerDriver} from "../driver/sqlserver/SqlServerDriver";
import {OracleDriver} from "../driver/oracle/OracleDriver";
import {EntitySchema} from "../entity-schema/EntitySchema";
import {FindOperator} from "../find-options/FindOperator";
import {In} from "../find-options/operator/In";
import {EntityColumnNotFound} from "../error/EntityColumnNotFound";
import {TypeORMError} from "../error";
import {WhereClause, WhereClauseCondition} from "./WhereClause";
import {NotBrackets} from "./NotBrackets";
import {ReturningType} from "../driver/Driver";

// todo: completely cover query builder with tests
// todo: entityOrProperty can be target name. implement proper behaviour if it is.
// todo: check in persistment if id exist on object and throw exception (can be in partial selection?)
// todo: fix problem with long aliases eg getMaxIdentifierLength
// todo: fix replacing in .select("COUNT(post.id) AS cnt") statement
// todo: implement joinAlways in relations and relationId
// todo: finish partial selection
// todo: sugar methods like: .addCount and .selectCount, selectCountAndMap, selectSum, selectSumAndMap, ...
// todo: implement @Select decorator
// todo: add select and map functions

// todo: implement relation/entity loading and setting them into properties within a separate query
// .loadAndMap("post.categories", "post.categories", qb => ...)
// .loadAndMap("post.categories", Category, qb => ...)

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export abstract class QueryBuilder<Entity> {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Connection on which QueryBuilder was created.
     */
    readonly connection: Connection;

    /**
     * Contains all properties of the QueryBuilder that needs to be build a final query.
     */
    readonly expressionMap: QueryExpressionMap;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Query runner used to execute query builder query.
     */
    protected queryRunner?: QueryRunner;

    /**
     * If QueryBuilder was created in a subquery mode then its parent QueryBuilder (who created subquery) will be stored here.
     */
    protected parentQueryBuilder: QueryBuilder<any>;

    /**
     * Memo to help keep place of current parameter index for `createParameter`
     */
    private parameterIndex = 0;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /**
     * QueryBuilder can be initialized from given Connection and QueryRunner objects or from given other QueryBuilder.
     */
    constructor(queryBuilder: QueryBuilder<any>);

    /**
     * QueryBuilder can be initialized from given Connection and QueryRunner objects or from given other QueryBuilder.
     */
    constructor(connection: Connection, queryRunner?: QueryRunner);

    /**
     * QueryBuilder can be initialized from given Connection and QueryRunner objects or from given other QueryBuilder.
     */
    constructor(connectionOrQueryBuilder: Connection|QueryBuilder<any>, queryRunner?: QueryRunner) {
        if (connectionOrQueryBuilder instanceof QueryBuilder) {
            this.connection = connectionOrQueryBuilder.connection;
            this.queryRunner = connectionOrQueryBuilder.queryRunner;
            this.expressionMap = connectionOrQueryBuilder.expressionMap.clone();

        } else {
            this.connection = connectionOrQueryBuilder;
            this.queryRunner = queryRunner;
            this.expressionMap = new QueryExpressionMap(this.connection);
        }
    }

    // -------------------------------------------------------------------------
    // Abstract Methods
    // -------------------------------------------------------------------------

    /**
     * Gets generated SQL query without parameters being replaced.
     */
    abstract getQuery(): string;

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Gets the main alias string used in this query builder.
     */
    get alias(): string {
        if (!this.expressionMap.mainAlias)
            throw new TypeORMError(`Main alias is not set`); // todo: better exception

        return this.expressionMap.mainAlias.name;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates SELECT query.
     * Replaces all previous selections if they exist.
     */
    select(): SelectQueryBuilder<Entity>;

    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    select(selection: string, selectionAliasName?: string): SelectQueryBuilder<Entity>;

    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    select(selection: string[]): SelectQueryBuilder<Entity>;

    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    select(selection?: string|string[], selectionAliasName?: string): SelectQueryBuilder<Entity> {
        this.expressionMap.queryType = "select";
        if (Array.isArray(selection)) {
            this.expressionMap.selects = selection.map(selection => ({ selection: selection }));
        } else if (selection) {
            this.expressionMap.selects = [{ selection: selection, aliasName: selectionAliasName }];
        }

        // loading it dynamically because of circular issue
        const SelectQueryBuilderCls = require("./SelectQueryBuilder").SelectQueryBuilder;
        if (this instanceof SelectQueryBuilderCls)
            return this as any;

        return new SelectQueryBuilderCls(this);
    }

    /**
     * Creates INSERT query.
     */
    insert(): InsertQueryBuilder<Entity> {
        this.expressionMap.queryType = "insert";

        // loading it dynamically because of circular issue
        const InsertQueryBuilderCls = require("./InsertQueryBuilder").InsertQueryBuilder;
        if (this instanceof InsertQueryBuilderCls)
            return this as any;

        return new InsertQueryBuilderCls(this);
    }

    /**
     * Creates UPDATE query and applies given update values.
     */
    update(): UpdateQueryBuilder<Entity>;

    /**
     * Creates UPDATE query and applies given update values.
     */
    update(updateSet: QueryDeepPartialEntity<Entity>): UpdateQueryBuilder<Entity>;

    /**
     * Creates UPDATE query for the given entity and applies given update values.
     */
    update<Entity>(entity: EntityTarget<Entity>, updateSet?: QueryDeepPartialEntity<Entity>): UpdateQueryBuilder<Entity>;

    /**
     * Creates UPDATE query for the given table name and applies given update values.
     */
    update(tableName: string, updateSet?: QueryDeepPartialEntity<Entity>): UpdateQueryBuilder<Entity>;

    /**
     * Creates UPDATE query and applies given update values.
     */
    update(entityOrTableNameUpdateSet?: EntityTarget<any>|ObjectLiteral, maybeUpdateSet?: ObjectLiteral): UpdateQueryBuilder<any> {
        const updateSet = maybeUpdateSet ? maybeUpdateSet : entityOrTableNameUpdateSet as ObjectLiteral|undefined;
        entityOrTableNameUpdateSet = entityOrTableNameUpdateSet instanceof EntitySchema ? entityOrTableNameUpdateSet.options.name : entityOrTableNameUpdateSet;

        if (entityOrTableNameUpdateSet instanceof Function || typeof entityOrTableNameUpdateSet === "string") {
            const mainAlias = this.createFromAlias(entityOrTableNameUpdateSet);
            this.expressionMap.setMainAlias(mainAlias);
        }

        this.expressionMap.queryType = "update";
        this.expressionMap.valuesSet = updateSet;

        // loading it dynamically because of circular issue
        const UpdateQueryBuilderCls = require("./UpdateQueryBuilder").UpdateQueryBuilder;
        if (this instanceof UpdateQueryBuilderCls)
            return this as any;

        return new UpdateQueryBuilderCls(this);
    }

    /**
     * Creates DELETE query.
     */
    delete(): DeleteQueryBuilder<Entity> {
        this.expressionMap.queryType = "delete";

        // loading it dynamically because of circular issue
        const DeleteQueryBuilderCls = require("./DeleteQueryBuilder").DeleteQueryBuilder;
        if (this instanceof DeleteQueryBuilderCls)
            return this as any;

        return new DeleteQueryBuilderCls(this);
    }

    softDelete(): SoftDeleteQueryBuilder<any> {
        this.expressionMap.queryType = "soft-delete";

        // loading it dynamically because of circular issue
        const SoftDeleteQueryBuilderCls = require("./SoftDeleteQueryBuilder").SoftDeleteQueryBuilder;
        if (this instanceof SoftDeleteQueryBuilderCls)
            return this as any;

        return new SoftDeleteQueryBuilderCls(this);
    }

    restore(): SoftDeleteQueryBuilder<any> {
        this.expressionMap.queryType = "restore";

        // loading it dynamically because of circular issue
        const SoftDeleteQueryBuilderCls = require("./SoftDeleteQueryBuilder").SoftDeleteQueryBuilder;
        if (this instanceof SoftDeleteQueryBuilderCls)
            return this as any;

        return new SoftDeleteQueryBuilderCls(this);
    }

    /**
     * Sets entity's relation with which this query builder gonna work.
     */
    relation(propertyPath: string): RelationQueryBuilder<Entity>;

    /**
     * Sets entity's relation with which this query builder gonna work.
     */
    relation<T>(entityTarget: EntityTarget<T>, propertyPath: string): RelationQueryBuilder<T>;

    /**
     * Sets entity's relation with which this query builder gonna work.
     */
    relation(entityTargetOrPropertyPath: Function|string, maybePropertyPath?: string): RelationQueryBuilder<Entity> {
        const entityTarget = arguments.length === 2 ? entityTargetOrPropertyPath : undefined;
        const propertyPath = arguments.length === 2 ? maybePropertyPath as string : entityTargetOrPropertyPath as string;

        this.expressionMap.queryType = "relation";
        this.expressionMap.relationPropertyPath = propertyPath;

        if (entityTarget) {
            const mainAlias = this.createFromAlias(entityTarget);
            this.expressionMap.setMainAlias(mainAlias);
        }

        // loading it dynamically because of circular issue
        const RelationQueryBuilderCls = require("./RelationQueryBuilder").RelationQueryBuilder;
        if (this instanceof RelationQueryBuilderCls)
            return this as any;

        return new RelationQueryBuilderCls(this);
    }


    /**
     * Checks if given relation exists in the entity.
     * Returns true if relation exists, false otherwise.
     *
     * todo: move this method to manager? or create a shortcut?
     */
    hasRelation<T>(target: EntityTarget<T>, relation: string): boolean;

    /**
     * Checks if given relations exist in the entity.
     * Returns true if relation exists, false otherwise.
     *
     * todo: move this method to manager? or create a shortcut?
     */
    hasRelation<T>(target: EntityTarget<T>, relation: string[]): boolean;

    /**
     * Checks if given relation or relations exist in the entity.
     * Returns true if relation exists, false otherwise.
     *
     * todo: move this method to manager? or create a shortcut?
     */
    hasRelation<T>(target: EntityTarget<T>, relation: string|string[]): boolean {
        const entityMetadata = this.connection.getMetadata(target);
        const relations = Array.isArray(relation) ? relation : [relation];
        return relations.every(relation => {
            return !!entityMetadata.findRelationWithPropertyPath(relation);
        });
    }

    /**
     * Check the existence of a parameter for this query builder.
     */
    hasParameter(key: string): boolean {
        return this.parentQueryBuilder?.hasParameter(key) || key in this.expressionMap.parameters;
    }

    /**
     * Sets parameter name and its value.
     *
     * The key for this parametere may contain numbers, letters, underscores, or periods.
     */
    setParameter(key: string, value: any): this {
        if (value instanceof Function) {
            throw new TypeORMError(`Function parameter isn't supported in the parameters. Please check "${key}" parameter.`);
        }

        if (!key.match(/^([A-Za-z0-9_.]+)$/)) {
            throw new TypeORMError("QueryBuilder parameter keys may only contain numbers, letters, underscores, or periods.");
        }

        if (this.parentQueryBuilder) {
            this.parentQueryBuilder.setParameter(key, value);
        }

        this.expressionMap.parameters[key] = value;
        return this;
    }

    /**
     * Adds all parameters from the given object.
     */
    setParameters(parameters: ObjectLiteral): this {
        for (const [key, value] of Object.entries(parameters)) {
            this.setParameter(key, value);
        }

        return this;
    }

    protected createParameter(value: any): string {
        let parameterName;

        do {
            parameterName = `orm_param_${this.parameterIndex++}`;
        } while (this.hasParameter(parameterName));

        this.setParameter(parameterName, value);

        return `:${parameterName}`;
    }

    /**
     * Adds native parameters from the given object.
     *
     * @deprecated Use `setParameters` instead
     */
    setNativeParameters(parameters: ObjectLiteral): this {

        // set parent query builder parameters as well in sub-query mode
        if (this.parentQueryBuilder) {
            this.parentQueryBuilder.setNativeParameters(parameters);
        }

        Object.keys(parameters).forEach(key => {
            this.expressionMap.nativeParameters[key] = parameters[key];
        });
        return this;
    }

    /**
     * Gets all parameters.
     */
    getParameters(): ObjectLiteral {
        const parameters: ObjectLiteral = Object.assign({}, this.expressionMap.parameters);

        // add discriminator column parameter if it exist
        if (this.expressionMap.mainAlias && this.expressionMap.mainAlias.hasMetadata) {
            const metadata = this.expressionMap.mainAlias!.metadata;
            if (metadata.discriminatorColumn && metadata.parentEntityMetadata) {
                const values = metadata.childEntityMetadatas
                    .filter(childMetadata => childMetadata.discriminatorColumn)
                    .map(childMetadata => childMetadata.discriminatorValue);
                values.push(metadata.discriminatorValue);
                parameters["discriminatorColumnValues"] = values;
            }
        }

        return parameters;
    }

    /**
     * Prints sql to stdout using console.log.
     */
    printSql(): this { // TODO rename to logSql()
        const [query, parameters] = this.getQueryAndParameters();
        this.connection.logger.logQuery(query, parameters);
        return this;
    }

    /**
     * Gets generated sql that will be executed.
     * Parameters in the query are escaped for the currently used driver.
     */
    getSql(): string {
        return this.getQueryAndParameters()[0];
    }

    /**
     * Gets query to be executed with all parameters used in it.
     */
    getQueryAndParameters(): [string, any[]] {
        // this execution order is important because getQuery method generates this.expressionMap.nativeParameters values
        const query = this.getQuery();
        const parameters = this.getParameters();
        return this.connection.driver.escapeQueryWithParameters(query, parameters, this.expressionMap.nativeParameters);
    }

    /**
     * Executes sql generated by query builder and returns raw database results.
     */
    async execute(): Promise<any> {
        const [sql, parameters] = this.getQueryAndParameters();
        const queryRunner = this.obtainQueryRunner();
        try {
            return await queryRunner.query(sql, parameters);  // await is needed here because we are using finally
        } finally {
            if (queryRunner !== this.queryRunner) { // means we created our own query runner
                await queryRunner.release();
            }
        }
    }

    /**
     * Creates a completely new query builder.
     * Uses same query runner as current QueryBuilder.
     */
    createQueryBuilder(): this {
        return new (this.constructor as any)(this.connection, this.queryRunner);
    }

    /**
     * Clones query builder as it is.
     * Note: it uses new query runner, if you want query builder that uses exactly same query runner,
     * you can create query builder using its constructor, for example new SelectQueryBuilder(queryBuilder)
     * where queryBuilder is cloned QueryBuilder.
     */
    clone(): this {
        return new (this.constructor as any)(this);
    }

    /**
     * Includes a Query comment in the query builder.  This is helpful for debugging purposes,
     * such as finding a specific query in the database server's logs, or for categorization using
     * an APM product.
     */
    comment(comment: string): this {
        this.expressionMap.comment = comment;
        return this;
    }

    /**
     * Disables escaping.
     */
    disableEscaping(): this {
        this.expressionMap.disableEscaping = false;
        return this;
    }

    /**
     * Escapes table name, column name or alias name using current database's escaping character.
     */
    escape(name: string): string {
        if (!this.expressionMap.disableEscaping)
            return name;
        return this.connection.driver.escape(name);
    }

    /**
     * Sets or overrides query builder's QueryRunner.
     */
    setQueryRunner(queryRunner: QueryRunner): this {
        this.queryRunner = queryRunner;
        return this;
    }

    /**
     * Indicates if listeners and subscribers must be called before and after query execution.
     * Enabled by default.
     */
    callListeners(enabled: boolean): this {
        this.expressionMap.callListeners = enabled;
        return this;
    }

    /**
     * If set to true the query will be wrapped into a transaction.
     */
    useTransaction(enabled: boolean): this {
        this.expressionMap.useTransaction = enabled;
        return this;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Gets escaped table name with schema name if SqlServer driver used with custom
     * schema name, otherwise returns escaped table name.
     */
    protected getTableName(tablePath: string): string {
        return tablePath.split(".")
            .map(i => {
                // this condition need because in SQL Server driver when custom database name was specified and schema name was not, we got `dbName..tableName` string, and doesn't need to escape middle empty string
                if (i === "")
                    return i;
                return this.escape(i);
            }).join(".");
    }

    /**
     * Gets name of the table where insert should be performed.
     */
    protected getMainTableName(): string {
        if (!this.expressionMap.mainAlias)
            throw new TypeORMError(`Entity where values should be inserted is not specified. Call "qb.into(entity)" method to specify it.`);

        if (this.expressionMap.mainAlias.hasMetadata)
            return this.expressionMap.mainAlias.metadata.tablePath;

        return this.expressionMap.mainAlias.tablePath!;
    }

    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     */
    protected createFromAlias(entityTarget: EntityTarget<any>|((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), aliasName?: string): Alias {

        // if table has a metadata then find it to properly escape its properties
        // const metadata = this.connection.entityMetadatas.find(metadata => metadata.tableName === tableName);
        if (this.connection.hasMetadata(entityTarget)) {
            const metadata = this.connection.getMetadata(entityTarget);

            return this.expressionMap.createAlias({
                type: "from",
                name: aliasName,
                metadata: this.connection.getMetadata(entityTarget),
                tablePath: metadata.tablePath
            });

        } else {
            if (typeof entityTarget === "string") {
                const isSubquery = entityTarget.substr(0, 1) === "(" && entityTarget.substr(-1) === ")";

                return this.expressionMap.createAlias({
                    type: "from",
                    name: aliasName,
                    tablePath: !isSubquery ? entityTarget as string : undefined,
                    subQuery: isSubquery ? entityTarget : undefined,
                });
            }

            const subQueryBuilder: SelectQueryBuilder<any> = (entityTarget as any)(((this as any) as SelectQueryBuilder<any>).subQuery());
            this.setParameters(subQueryBuilder.getParameters());
            const subquery = subQueryBuilder.getQuery();

            return this.expressionMap.createAlias({
                type: "from",
                name: aliasName,
                subQuery: subquery
            });
        }
    }

    /**
     * Replaces all entity's propertyName to name in the given statement.
     */
    protected replacePropertyNames(statement: string) {
        // Escape special characters in regular expressions
        // Per https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
        const escapeRegExp = (s: String) => s.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");

        for (const alias of this.expressionMap.aliases) {
            if (!alias.hasMetadata) continue;
            const replaceAliasNamePrefix = this.expressionMap.aliasNamePrefixingEnabled ? `${alias.name}.` : "";
            const replacementAliasNamePrefix = this.expressionMap.aliasNamePrefixingEnabled ? `${this.escape(alias.name)}.` : "";

            const replacements: { [key: string]: string } = {};

            // Insert & overwrite the replacements from least to most relevant in our replacements object.
            // To do this we iterate and overwrite in the order of relevance.
            // Least to Most Relevant:
            // * Relation Property Path to first join column key
            // * Relation Property Path + Column Path
            // * Column Database Name
            // * Column Propety Name
            // * Column Property Path

            for (const relation of alias.metadata.relations) {
                if (relation.joinColumns.length > 0)
                    replacements[relation.propertyPath] = relation.joinColumns[0].databaseName;
            }

            for (const relation of alias.metadata.relations) {
                for (const joinColumn of [...relation.joinColumns, ...relation.inverseJoinColumns]) {
                    const propertyKey = `${relation.propertyPath}.${joinColumn.referencedColumn!.propertyPath}`;
                    replacements[propertyKey] = joinColumn.databaseName;
                }
            }

            for (const column of alias.metadata.columns) {
                replacements[column.databaseName] = column.databaseName;
            }

            for (const column of alias.metadata.columns) {
                replacements[column.propertyName] = column.databaseName;
            }

            for (const column of alias.metadata.columns) {
                replacements[column.propertyPath] = column.databaseName;
            }

            const replacementKeys = Object.keys(replacements);

            if (replacementKeys.length) {
                statement = statement.replace(new RegExp(
                    // Avoid a lookbehind here since it's not well supported
                    `([ =\(]|^.{0})` +
                    `${escapeRegExp(replaceAliasNamePrefix)}(${replacementKeys.map(escapeRegExp).join("|")})` +
                    `(?=[ =\)\,]|.{0}$)`,
                    "gm"
                ), (_, pre, p) =>
                    `${pre}${replacementAliasNamePrefix}${this.escape(replacements[p])}`
                );
            }
        }

        return statement;
    }

    protected createComment(): string {
        if (!this.expressionMap.comment) {
            return "";
        }

        // ANSI SQL 2003 support C style comments - comments that start with `/*` and end with `*/`
        // In some dialects query nesting is available - but not all.  Because of this, we'll need
        // to scrub "ending" characters from the SQL but otherwise we can leave everything else
        // as-is and it should be valid.

        return `/* ${this.expressionMap.comment.replace("*/", "")} */ `;
    }

    /**
     * Creates "WHERE" expression.
     */
    protected createWhereExpression() {
        const conditionsArray = [];

        const whereExpression = this.createWhereClausesExpression(this.expressionMap.wheres);

        if (whereExpression.length > 0 && whereExpression !== "1=1") {
            conditionsArray.push(this.replacePropertyNames(whereExpression));
        }

        if (this.expressionMap.mainAlias!.hasMetadata) {
            const metadata = this.expressionMap.mainAlias!.metadata;
            // Adds the global condition of "non-deleted" for the entity with delete date columns in select query.
            if (this.expressionMap.queryType === "select" && !this.expressionMap.withDeleted && metadata.deleteDateColumn) {
                const column = this.expressionMap.aliasNamePrefixingEnabled
                    ? this.expressionMap.mainAlias!.name + "." + metadata.deleteDateColumn.propertyName
                    : metadata.deleteDateColumn.propertyName;

                const condition = `${this.replacePropertyNames(column)} IS NULL`;
                conditionsArray.push(condition);
            }

            if (metadata.discriminatorColumn && metadata.parentEntityMetadata) {
                const column = this.expressionMap.aliasNamePrefixingEnabled
                    ? this.expressionMap.mainAlias!.name + "." + metadata.discriminatorColumn.databaseName
                    : metadata.discriminatorColumn.databaseName;

                const condition = `${this.replacePropertyNames(column)} IN (:...discriminatorColumnValues)`;
                conditionsArray.push(condition);
            }
        }

        if (this.expressionMap.extraAppendedAndWhereCondition) {
            const condition = this.replacePropertyNames(this.expressionMap.extraAppendedAndWhereCondition);
            conditionsArray.push(condition);
        }

        if (!conditionsArray.length) {
            return "";
        } else if (conditionsArray.length === 1) {
            return ` WHERE ${conditionsArray[0]}`;
        } else {
            return ` WHERE ( ${conditionsArray.join(" ) AND ( ")} )`;
        }
    }

    /**
     * Creates "RETURNING" / "OUTPUT" expression.
     */
    protected createReturningExpression(returningType: ReturningType): string {
        const columns = this.getReturningColumns();
        const driver = this.connection.driver;

        // also add columns we must auto-return to perform entity updation
        // if user gave his own returning
        if (typeof this.expressionMap.returning !== "string" &&
            this.expressionMap.extraReturningColumns.length > 0 &&
            driver.isReturningSqlSupported(returningType)) {
            columns.push(...this.expressionMap.extraReturningColumns.filter(column => {
                return columns.indexOf(column) === -1;
            }));
        }

        if (columns.length) {
            let columnsExpression = columns.map(column => {
                const name = this.escape(column.databaseName);
                if (driver instanceof SqlServerDriver) {
                    if (this.expressionMap.queryType === "insert" || this.expressionMap.queryType === "update" || this.expressionMap.queryType === "soft-delete" || this.expressionMap.queryType === "restore") {
                        return "INSERTED." + name;
                    } else {
                        return this.escape(this.getMainTableName()) + "." + name;
                    }
                } else {
                    return name;
                }
            }).join(", ");

            if (driver instanceof OracleDriver) {
                columnsExpression += " INTO " + columns.map(column => {
                    return this.createParameter({ type: driver.columnTypeToNativeParameter(column.type), dir: driver.oracle.BIND_OUT });
                }).join(", ");
            }

            if (driver instanceof SqlServerDriver) {
                if (this.expressionMap.queryType === "insert" || this.expressionMap.queryType === "update") {
                    columnsExpression += " INTO @OutputTable";
                }
            }

            return columnsExpression;

        } else if (typeof this.expressionMap.returning === "string") {
            return this.expressionMap.returning;
        }

        return "";
    }

    /**
     * If returning / output cause is set to array of column names,
     * then this method will return all column metadatas of those column names.
     */
    protected getReturningColumns(): ColumnMetadata[] {
        const columns: ColumnMetadata[] = [];
        if (Array.isArray(this.expressionMap.returning)) {
            (this.expressionMap.returning as string[]).forEach(columnName => {
                if (this.expressionMap.mainAlias!.hasMetadata) {
                    columns.push(...this.expressionMap.mainAlias!.metadata.findColumnsWithPropertyPath(columnName));
                }
            });
        }
        return columns;
    }

    protected createWhereClausesExpression(clauses: WhereClause[]): string {
        return clauses.map((clause, index) => {
            const expression = this.createWhereConditionExpression(clause.condition);

            switch (clause.type) {
                case "and":
                    return (index > 0 ? "AND " : "") + expression;
                case "or":
                    return (index > 0 ? "OR " : "") + expression;
            }

            return expression;
        }).join(" ").trim();
    }

    /**
     * Computes given where argument - transforms to a where string all forms it can take.
     */
    protected createWhereConditionExpression(condition: WhereClauseCondition, alwaysWrap: boolean = false): string {
        if (typeof condition === "string")
            return condition;

        if (Array.isArray(condition)) {
            if (condition.length === 0) {
                return "1=1";
            }

            // In the future we should probably remove this entire condition
            // but for now to prevent any breaking changes it exists.
            if (condition.length === 1 && !alwaysWrap) {
                return this.createWhereClausesExpression(condition);
            }

            return "(" + this.createWhereClausesExpression(condition) + ")";
        }

        const { driver } = this.connection;

        switch (condition.operator) {
            case "lessThan":
                return `${condition.parameters[0]} < ${condition.parameters[1]}`;
            case "lessThanOrEqual":
                return `${condition.parameters[0]} <= ${condition.parameters[1]}`;
            case "moreThan":
                return `${condition.parameters[0]} > ${condition.parameters[1]}`;
            case "moreThanOrEqual":
                return `${condition.parameters[0]} >= ${condition.parameters[1]}`;
            case "notEqual":
                return `${condition.parameters[0]} != ${condition.parameters[1]}`;
            case "equal":
                return `${condition.parameters[0]} = ${condition.parameters[1]}`;
            case "ilike":
                if (driver instanceof PostgresDriver || driver instanceof CockroachDriver) {
                    return `${condition.parameters[0]} ILIKE ${condition.parameters[1]}`;
                }

                return `UPPER(${condition.parameters[0]}) LIKE UPPER(${condition.parameters[1]})`;
            case "like":
                return `${condition.parameters[0]} LIKE ${condition.parameters[1]}`;
            case "between":
                return `${condition.parameters[0]} BETWEEN ${condition.parameters[1]} AND ${condition.parameters[2]}`;
            case "in":
                if (condition.parameters.length <= 1) {
                    return "0=1";
                }
                return `${condition.parameters[0]} IN (${condition.parameters.slice(1).join(", ")})`;
            case "any":
                return `${condition.parameters[0]} = ANY(${condition.parameters[1]})`;
            case "isNull":
                return `${condition.parameters[0]} IS NULL`;

            case "not":
                return `NOT(${this.createWhereConditionExpression(condition.condition)})`;
            case "brackets":
                return `${this.createWhereConditionExpression(condition.condition, true)}`;
        }

        throw new TypeError(`Unsupported FindOperator ${FindOperator.constructor.name}`);
    }

    /**
     * Creates "WHERE" condition for an in-ids condition.
     */
    protected getWhereInIdsCondition(ids: any|any[]): ObjectLiteral | Brackets  {
        const metadata = this.expressionMap.mainAlias!.metadata;
        const normalized = (Array.isArray(ids) ? ids : [ids]).map(id => metadata.ensureEntityIdMap(id));

        // using in(...ids) for single primary key entities
        if (!metadata.hasMultiplePrimaryKeys) {
            const primaryColumn = metadata.primaryColumns[0];

            // getEntityValue will try to transform `In`, it is a bug
            // todo: remove this transformer check after #2390 is fixed
            // This also fails for embedded & relation, so until that is fixed skip it.
            if (!primaryColumn.transformer && !primaryColumn.relationMetadata && !primaryColumn.embeddedMetadata) {
                return {
                    [primaryColumn.propertyName]: In(
                        normalized.map(id => primaryColumn.getEntityValue(id, false))
                    )
                };
            }
        }

        return new Brackets((qb) => {
            for (const data of normalized) {
                qb.orWhere(new Brackets(
                    (qb) => qb.where(data)
                ));
            }
        });
    }

    private findColumnsForPropertyPath(propertyPath: string): [ Alias, string[], ColumnMetadata[] ] {
        // Make a helper to iterate the entity & relations?
        // Use that to set the correct alias?  Or the other way around?

        // Start with the main alias with our property paths
        let alias = this.expressionMap.mainAlias;
        const root: string[] = [];
        const propertyPathParts = propertyPath.split(".");

        while (propertyPathParts.length > 1) {
            const part = propertyPathParts[0];

            if (!alias?.hasMetadata) {
                // If there's no metadata, we're wasting our time
                // and can't actually look any of this up.
                break;
            }

            if (alias.metadata.hasEmbeddedWithPropertyPath(part)) {
                // If this is an embedded then we should combine the two as part of our lookup.
                // Instead of just breaking, we keep going with this in case there's an embedded/relation
                // inside an embedded.
                propertyPathParts.unshift(
                    `${propertyPathParts.shift()}.${propertyPathParts.shift()}`
                );
                continue;
            }

            if (alias.metadata.hasRelationWithPropertyPath(part)) {
                // If this is a relation then we should find the aliases
                // that match the relation & then continue further down
                // the property path
                const joinAttr = this.expressionMap.joinAttributes.find(
                    (joinAttr) => joinAttr.relationPropertyPath === part
                );

                if (!joinAttr?.alias) {
                    const fullRelationPath = root.length > 0 ? `${root.join(".")}.${part}` : part;
                    throw new Error(`Cannot find alias for relation at ${fullRelationPath}`);
                }

                alias = joinAttr.alias;
                root.push(...part.split("."));
                propertyPathParts.shift();
                continue;
            }

            break;
        }

        if (!alias) {
            throw new Error(`Cannot find alias for property ${propertyPath}`);
        }

        // Remaining parts are combined back and used to find the actual property path
        const aliasPropertyPath = propertyPathParts.join(".");

        const columns = alias.metadata.findColumnsWithPropertyPath(aliasPropertyPath);

        if (!columns.length) {
            throw new EntityColumnNotFound(propertyPath);
        }

        return [ alias, root, columns ];
    }

    /**
     * Creates a property paths for a given ObjectLiteral.
     */
    protected createPropertyPath(metadata: EntityMetadata, entity: ObjectLiteral, prefix: string = "") {
        const paths: string[] = [];

        for (const key of Object.keys(entity)) {
            const path = prefix ? `${prefix}.${key}` : key;

            // There's times where we don't actually want to traverse deeper.
            // If the value is a `FindOperator`, or null, or not an object, then we don't, for example.
            if (entity[key] === null || typeof entity[key] !== "object" || entity[key] instanceof FindOperator) {
                paths.push(path);
                continue;
            }

            if (metadata.hasEmbeddedWithPropertyPath(path)) {
                const subPaths = this.createPropertyPath(metadata, entity[key], path);
                paths.push(...subPaths);
                continue;
            }

            if (metadata.hasRelationWithPropertyPath(path)) {
                const relation = metadata.findRelationWithPropertyPath(path)!;

                // There's also cases where we don't want to return back all of the properties.
                // These handles the situation where someone passes the model & we don't need to make
                // a HUGE `where` to uniquely look up the entity.

                // In the case of a *-to-one, there's only ever one possible entity on the other side
                // so if the join columns are all defined we can return just the relation itself
                // because it will fetch only the join columns and do the lookup.
                if (relation.relationType === "one-to-one" || relation.relationType === "many-to-one") {
                    const joinColumns = relation.joinColumns
                        .map(j => j.referencedColumn)
                        .filter((j): j is ColumnMetadata => !!j);

                    const hasAllJoinColumns = joinColumns.length > 0 && joinColumns.every(
                        column => column.getEntityValue(entity[key], false)
                    );

                    if (hasAllJoinColumns) {
                        paths.push(path);
                        continue;
                    }
                }

                if (relation.relationType === "one-to-many" || relation.relationType === "many-to-many") {
                    throw new Error(`Cannot query across ${relation.relationType} for property ${path}`);
                }

                // For any other case, if the `entity[key]` contains all of the primary keys we can do a
                // lookup via these.  We don't need to look up via any other values 'cause these are
                // the unique primary keys.
                // This handles the situation where someone passes the model & we don't need to make
                // a HUGE where.
                const primaryColumns = relation.inverseEntityMetadata.primaryColumns;
                const hasAllPrimaryKeys = primaryColumns.length > 0 && primaryColumns.every(
                    column => column.getEntityValue(entity[key], false)
                );

                if (hasAllPrimaryKeys) {
                    const subPaths = primaryColumns.map(
                        column => `${path}.${column.propertyPath}`
                    );
                    paths.push(...subPaths);
                    continue;
                }

                // If nothing else, just return every property that's being passed to us.
                const subPaths = this.createPropertyPath(relation.inverseEntityMetadata, entity[key])
                    .map(p => `${path}.${p}`);
                paths.push(...subPaths);
                continue;
            }

            paths.push(path);
        }

        return paths;
    }

    protected *getPredicates(where: ObjectLiteral) {
        if (this.expressionMap.mainAlias!.hasMetadata) {
            const propertyPaths = this.createPropertyPath(this.expressionMap.mainAlias!.metadata, where);

            for (const propertyPath of propertyPaths) {
                const [ alias, aliasPropertyPath, columns ] = this.findColumnsForPropertyPath(propertyPath);

                for (const column of columns) {
                    let containedWhere = where;

                    for (const part of aliasPropertyPath) {
                        if (!containedWhere || !(part in containedWhere)) {
                            containedWhere = {};
                            break;
                        }

                        containedWhere = containedWhere[part];
                    }

                    // Use the correct alias & the property path from the column
                    const aliasPath = this.expressionMap.aliasNamePrefixingEnabled ?
                        `${alias.name}.${column.propertyPath}` :
                        column.propertyPath;

                    const parameterValue = column.getEntityValue(containedWhere, true);

                    yield [aliasPath, parameterValue];
                }
            }
        } else {
            for (const key of Object.keys(where)) {
                const parameterValue = where[key];
                const aliasPath = this.expressionMap.aliasNamePrefixingEnabled ? `${this.alias}.${key}` : key;

                yield [aliasPath, parameterValue];
            }
        }
    }

    protected getWherePredicateCondition(aliasPath: string, parameterValue: any): WhereClauseCondition {
        if (parameterValue instanceof FindOperator) {
            let parameters: any[] = [];
            if (parameterValue.useParameter) {
                if (parameterValue.objectLiteralParameters) {
                    this.setParameters(parameterValue.objectLiteralParameters);
                } else if (parameterValue.multipleParameters) {
                    for (const v of parameterValue.value) {
                        parameters.push(this.createParameter(v));
                    }
                } else {
                    parameters.push(this.createParameter(parameterValue.value));
                }
            }

            if (parameterValue.type === "raw") {
                if (parameterValue.getSql) {
                    return parameterValue.getSql(aliasPath);
                } else {
                    return {
                        operator: "equal",
                        parameters: [
                            aliasPath,
                            parameterValue.value,
                        ]
                    };
                }
            } else if (parameterValue.type === "not") {
                if (parameterValue.child) {
                    return {
                        operator: parameterValue.type,
                        condition: this.getWherePredicateCondition(aliasPath, parameterValue.child),
                    };
                } else {
                    return {
                        operator: "notEqual",
                        parameters: [
                            aliasPath,
                            ...parameters,
                        ]
                    };
                }
            } else {
                return {
                    operator: parameterValue.type,
                    parameters: [
                        aliasPath,
                        ...parameters,
                    ]
                };
            }
        } else if (parameterValue === null) {
            return {
                operator: "isNull",
                parameters: [
                    aliasPath,
                ]
            };
        } else {
            return {
                operator: "equal",
                parameters: [
                    aliasPath,
                    this.createParameter(parameterValue),
                ]
            };
        }
    }

    protected getWhereCondition(where: string|((qb: this) => string)|Brackets|NotBrackets|ObjectLiteral|ObjectLiteral[]): WhereClauseCondition {
        if (typeof where === "string") {
            return where;
        }

        if (where instanceof Brackets) {
            const whereQueryBuilder = this.createQueryBuilder();

            whereQueryBuilder.parentQueryBuilder = this;

            whereQueryBuilder.expressionMap.mainAlias = this.expressionMap.mainAlias;
            whereQueryBuilder.expressionMap.aliasNamePrefixingEnabled = this.expressionMap.aliasNamePrefixingEnabled;
            whereQueryBuilder.expressionMap.parameters = this.expressionMap.parameters;
            whereQueryBuilder.expressionMap.nativeParameters = this.expressionMap.nativeParameters;

            whereQueryBuilder.expressionMap.wheres = [];

            where.whereFactory(whereQueryBuilder as any);

            return {
                operator: where instanceof NotBrackets ? "not" : "brackets",
                condition: whereQueryBuilder.expressionMap.wheres
            };
        }

        if (where instanceof Function) {
            return where(this);
        }

        const wheres: ObjectLiteral[] = Array.isArray(where) ? where : [where];
        const clauses: WhereClause[] = [];

        for (const where of wheres) {
            const conditions: WhereClauseCondition = [];

            // Filter the conditions and set up the parameter values
            for (const [aliasPath, parameterValue] of this.getPredicates(where)) {
                conditions.push({
                    type: "and",
                    condition: this.getWherePredicateCondition(aliasPath, parameterValue),
                });
            }

            clauses.push({ type: "or", condition: conditions });

        }

        if (clauses.length === 1) {
            return clauses[0].condition;
        }

        return clauses;
    }

    /**
     * Creates a query builder used to execute sql queries inside this query builder.
     */
    protected obtainQueryRunner() {
        return this.queryRunner || this.connection.createQueryRunner();
    }

}
