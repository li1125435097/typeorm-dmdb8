import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Post} from "./entity/Post";
import {MongoRepository} from "../../../../../src/repository/MongoRepository";

describe("mongodb > MongoRepository", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Post],
        enabledDrivers: ["mongodb"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("connection should return mongo repository when requested", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getMongoRepository(Post);
        expect(postRepository).to.be.instanceOf(MongoRepository);
    })));

    it("entity manager should return mongo repository when requested", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.manager.getMongoRepository(Post);
        expect(postRepository).to.be.instanceOf(MongoRepository);
    })));

    it("should be able to use entity cursor which will return instances of entity classes", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getMongoRepository(Post);

        // save few posts
        const firstPost = new Post();
        firstPost.title = "Post #1";
        firstPost.text = "Everything about post #1";
        await postRepository.save(firstPost);

        const secondPost = new Post();
        secondPost.title = "Post #2";
        secondPost.text = "Everything about post #2";
        await postRepository.save(secondPost);

        const cursor = postRepository.createEntityCursor({
            title: "Post #1"
        });

        const loadedPosts = await cursor.toArray();
        expect(loadedPosts).to.have.length(1);
        expect(loadedPosts[0]).to.be.instanceOf(Post);
        expect(loadedPosts[0].id).to.eql(firstPost.id);
        expect(loadedPosts[0].title).to.eql("Post #1");
        expect(loadedPosts[0].text).to.eql("Everything about post #1");

    })));

    it("should be able to use entity cursor which will return instances of entity classes", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getMongoRepository(Post);

        // save few posts
        const firstPost = new Post();
        firstPost.title = "Post #1";
        firstPost.text = "Everything about post #1";
        await postRepository.save(firstPost);

        const secondPost = new Post();
        secondPost.title = "Post #2";
        secondPost.text = "Everything about post #2";
        await postRepository.save(secondPost);

        const loadedPosts = await postRepository.find({
            where: {
                $or: [
                    {
                        title: "Post #1",
                    },
                    {
                        text: "Everything about post #1"
                    }
                ]
            }
        });

        expect(loadedPosts).to.have.length(1);
        expect(loadedPosts[0]).to.be.instanceOf(Post);
        expect(loadedPosts[0].id).to.eql(firstPost.id);
        expect(loadedPosts[0].title).to.eql("Post #1");
        expect(loadedPosts[0].text).to.eql("Everything about post #1");
    })));

    it("should be able to use findByIds with both objectId and strings", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getMongoRepository(Post);

        // save few posts
        const firstPost = new Post();
        firstPost.title = "Post #1";
        firstPost.text = "Everything about post #1";
        await postRepository.save(firstPost);

        const secondPost = new Post();
        secondPost.title = "Post #2";
        secondPost.text = "Everything about post #2";
        await postRepository.save(secondPost);

        expect(await postRepository.findByIds([ firstPost.id ])).to.have.length(1);
        expect(await postRepository.findByIds([ firstPost.id.toHexString() ])).to.have.length(1);
        expect(await postRepository.findByIds([ { id: firstPost.id } ])).to.have.length(1);
        expect(await postRepository.findByIds([ undefined ])).to.have.length(0);
    })));

    // todo: cover other methods as well
    it("should be able to save and update mongo entities", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getMongoRepository(Post);

        // save few posts
        const firstPost = new Post();
        firstPost.title = "Post #1";
        firstPost.text = "Everything about post #1";
        await postRepository.save(firstPost);

        const secondPost = new Post();
        secondPost.title = "Post #2";
        secondPost.text = "Everything about post #2";
        await postRepository.save(secondPost);

        // save few posts
        firstPost.text = "Everything and more about post #1";
        await postRepository.save(firstPost);

        const loadedPosts = await postRepository.find();

        expect(loadedPosts).to.have.length(2);
        expect(loadedPosts[0].text).to.eql("Everything and more about post #1");
        expect(loadedPosts[1].text).to.eql("Everything about post #2");
    })));

    it("should ignore non-column properties", () => Promise.all(connections.map(async connection => {
        // Github issue #5321
        const postRepository = connection.getMongoRepository(Post);

        await postRepository.save({
            title: "Hello",
            text: "World",
            unreal: "Not a Column"
        });

        const loadedPosts = await postRepository.find();

        expect(loadedPosts).to.have.length(1);
        expect(loadedPosts[0]).to.not.have.property("unreal");
    })));
});
