import { Connection } from "../../../src";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Author } from "./entity/Author";
import { Book } from "./entity/Book";
import { expect } from "chai";
import {OracleDriver} from "../../../src/driver/oracle/OracleDriver";

describe("github issues > #4980 (Postgres) onUpdate: 'CASCADE' doesn't work on many-to-many relation", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Author, Book],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should generate onDelete: CASCADE and onUpdate: CASCADE for 'books' side of many-to-many relation", () => Promise.all(connections.map(async connection => {
        const booksRelation = connection.getMetadata(Author).manyToManyRelations.find(mtm => mtm.propertyName === "books");
        expect(booksRelation).not.to.be.undefined;
        expect(booksRelation!.onDelete).to.be.equal("CASCADE");
        expect(booksRelation!.onUpdate).to.be.equal("CASCADE");
    })));

    it("should generate onDelete: NO ACTION and onUpdate: CASCADE for 'authors' side of many-to-many relation", () => Promise.all(connections.map(async connection => {
        const authorsRelation = connection.getMetadata(Book).manyToManyRelations.find(mtm => mtm.propertyName === "authors");
        expect(authorsRelation).not.to.be.undefined;
        expect(authorsRelation!.onDelete).to.be.equal("NO ACTION");
        expect(authorsRelation!.onUpdate).to.be.equal("CASCADE");
    })));

    it("should generate onDelete: NO ACTION and onUpdate: CASCADE for foreign key pointing to Book", () => Promise.all(connections.map(async connection => {
        const booksRelation = connection.getMetadata(Author).manyToManyRelations.find(mtm => mtm.propertyName === "books")!;
        const booksFk = booksRelation.foreignKeys.find(fk => fk.referencedTablePath === "book");
        expect(booksFk).not.to.be.undefined;
        expect(booksFk!.onDelete).to.be.equal("NO ACTION");

        // Oracle does not support ON UPDATE clause
        if (connection.driver instanceof OracleDriver) {
            expect(booksFk!.onUpdate).to.be.equal("NO ACTION");
        } else {
            expect(booksFk!.onUpdate).to.be.equal("CASCADE");
        }
    })));

    it("should generate onDelete: CASCADE and onUpdate: CASCADE for foreign key pointing to Author", () => Promise.all(connections.map(async connection => {
        // take books relation bc foreign keys are on owning side
        const booksRelation = connection.getMetadata(Author).manyToManyRelations.find(mtm => mtm.propertyName === "books")!;
        const authorsFk = booksRelation.foreignKeys.find(fk => fk.referencedTablePath === "author");
        expect(authorsFk).not.to.be.undefined;
        expect(authorsFk!.onDelete).to.be.equal("CASCADE");

        // Oracle does not support ON UPDATE clause
        if (connection.driver instanceof OracleDriver) {
            expect(authorsFk!.onUpdate).to.be.equal("NO ACTION");
        } else {
            expect(authorsFk!.onUpdate).to.be.equal("CASCADE");
        }
    })));
});
