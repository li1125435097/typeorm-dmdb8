/**
 * This class stores query and its parameters
 */
export class Query {
    constructor(public query: string, public parameters?: any[]) {
        this.query = query;
        this.parameters = parameters;
        // this["@instanceof"] = Symbol.for("Query");
    }
}
