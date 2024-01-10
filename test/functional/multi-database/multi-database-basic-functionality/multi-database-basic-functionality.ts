import "reflect-metadata";
import { expect } from 'chai';
import { Connection } from "../../../../src/connection/Connection";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils";
import { Answer } from "./entity/Answer";
import { Category } from "./entity/Category";
import { Post } from "./entity/Post";
import { User } from "./entity/User";
import { filepathToName } from "../../../../src/util/PathUtils";
import rimraf from "rimraf";
import path from "path";
import fs from "fs";

const VALID_NAME_REGEX = /^(?!sqlite_).{1,63}$/

describe("multi-database > basic-functionality", () => {

    describe("filepathToName()", () => {
        for (const platform of [`darwin`, `win32`]) {
            let realPlatform: string;

            beforeEach(() => {
                realPlatform = process.platform;
                Object.defineProperty(process, `platform`, {
                  configurable: true,
                  value: platform,
                });
              });

              afterEach(() => {
                Object.defineProperty(process, `platform`, {
                  configurable: true,
                  value: realPlatform,
                });
              });

              it(`produces deterministic, unique, and valid table names for relative paths; leaves absolute paths unchanged (${platform})`, () => {
                  const testMap = [
                      ["FILENAME.db", "filename.db"],
                      ["..\\FILENAME.db", "../filename.db"],
                      ["..\\longpathdir\\longpathdir\\longpathdir\\longpathdir\\longpathdir\\longpathdir\\longpathdir\\FILENAME.db", "../longpathdir/longpathdir/longpathdir/longpathdir/longpathdir/longpathdir/longpathdir/filename.db"],
                      ["C:\\dir\FILENAME.db", "C:\\dir\FILENAME.db"],
                      ["/dir/filename.db", "/dir/filename.db"],
                  ];
                  for (const [winOs, otherOs] of testMap) {
                      const winOsRes = filepathToName(winOs);
                      const otherOsRes = filepathToName(otherOs);
                      expect(winOsRes).to.equal(otherOsRes);
                      expect(winOsRes).to.match(VALID_NAME_REGEX, `'${winOs}' is invalid table name`);
                  }
              });
        }
    });

    describe("multiple databases", () => {

        let connections: Connection[];
        const tempPath = path.resolve(__dirname, "../../../../../../temp");
        const attachAnswerPath = path.join(tempPath, "filename-sqlite.db");
        const attachAnswerHandle = filepathToName("filename-sqlite.db");
        const attachCategoryPath = path.join(tempPath, "./subdir/relative-subdir-sqlite.db");
        const attachCategoryHandle = filepathToName("./subdir/relative-subdir-sqlite.db");

        before(async () => {
            connections = await createTestingConnections({
                entities: [Answer, Category, Post, User],
                // enabledDrivers: ["sqlite", "better-sqlite3"],
                enabledDrivers: ["sqlite"],
                name: "sqlite",
            });
        });
        beforeEach(() => reloadTestingDatabases(connections));
        after(async () => {
            await closeTestingConnections(connections);
            return new Promise(resolve => rimraf(`${tempPath}/**/*.db`, {}, () => resolve()));
        });

        it("should correctly attach and create database files", () => Promise.all(connections.map(async connection => {

            const expectedMainPath = path.join(tempPath, (connections[0].options.database as string).match(/^.*[\\|\/](?<filename>[^\\|\/]+)$/)!.groups!["filename"]);

            expect(fs.existsSync(expectedMainPath)).to.be.true;
            expect(fs.existsSync(attachAnswerPath)).to.be.true;
            expect(fs.existsSync(attachCategoryPath)).to.be.true;
        })));

        it("should prefix tableName when custom database used in Entity decorator", () => Promise.all(connections.map(async connection => {

            const queryRunner = connection.createQueryRunner();

            const tablePathAnswer = `${attachAnswerHandle}.answer`;
            const table = await queryRunner.getTable(tablePathAnswer);
            await queryRunner.release();

            const answer = new Answer();
            answer.text = "Answer #1";

            await connection.getRepository(Answer).save(answer);

            const sql = connection.createQueryBuilder(Answer, "answer")
                .where("answer.id = :id", {id: 1})
                .getSql();

            sql.should.be.equal(`SELECT "answer"."id" AS "answer_id", "answer"."text" AS "answer_text" FROM "${attachAnswerHandle}"."answer" "answer" WHERE "answer"."id" = ?`);
            table!.name.should.be.equal(tablePathAnswer);
        })));

        it("should not affect tableName when using default main database", () => Promise.all(connections.map(async connection => {

            const queryRunner = connection.createQueryRunner();

            const tablePathUser = `user`;
            const table = await queryRunner.getTable(tablePathUser);
            await queryRunner.release();

            const user = new User();
            user.name = "User #1";
            await connection.getRepository(User).save(user);

            const sql = connection.createQueryBuilder(User, "user")
                .where("user.id = :id", {id: 1})
                .getSql();

            sql.should.be.equal(`SELECT "user"."id" AS "user_id", "user"."name" AS "user_name" FROM "user" "user" WHERE "user"."id" = ?`);

            table!.name.should.be.equal(tablePathUser);
        })));

        it("should create foreign keys for relations within the same database", () => Promise.all(connections.map(async connection => {

            const queryRunner = connection.createQueryRunner();
            const tablePathCategory = `${attachCategoryHandle}.category`;
            const tablePathPost = `${attachCategoryHandle}.post`;
            const tableCategory = (await queryRunner.getTable(tablePathCategory))!;
            const tablePost = (await queryRunner.getTable(tablePathPost))!;
            await queryRunner.release();

            expect(tableCategory.foreignKeys.length).to.eq(1);
            expect(tableCategory.foreignKeys[0].columnNames.length).to.eq(1);  // before the fix this was 2, one for each schema
            expect(tableCategory.foreignKeys[0].columnNames[0]).to.eq("postId");

            expect(tablePost.foreignKeys.length).to.eq(0);
        })));
    });
});
