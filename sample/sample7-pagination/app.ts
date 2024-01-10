import "reflect-metadata";
import {ConnectionOptions, createConnection} from "../../src/index";
import {Post} from "./entity/Post";
import {PostCategory} from "./entity/PostCategory";
import {PostAuthor} from "./entity/PostAuthor";

const options: ConnectionOptions = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    synchronize: true,
    entities: [__dirname + "/entity/*"]
};

createConnection(options).then(connection => {

    let postRepository = connection.getRepository(Post);
    const posts: Post[] = [];
    
    let author = new PostAuthor();
    author.name = "Umed";
    
    for (let i = 0; i < 100; i++) {

        let category1 = new PostCategory();
        category1.name = "post category #1";

        let category2 = new PostCategory();
        category2.name = "post category #2";

        let post = new Post();
        post.text = "Hello how are you?";
        post.title = "hello";
        post.categories.push(category1, category2);
        post.author = author;

        posts.push(post);
    }
    
    const qb = postRepository
        .createQueryBuilder("p")
        .leftJoinAndSelect("p.author", "author")
        .leftJoinAndSelect("p.categories", "categories")
        .skip(5)
        .take(10);

    Promise.all(posts.map(post => postRepository.save(post)))
        .then(savedPosts => {
            console.log("Posts has been saved. Lets try to load some posts");
            return qb.getMany();
        })
        .then(loadedPost => {
            console.log("post loaded: ", loadedPost);
            console.log("now lets get total post count: ");
            return qb.getCount();
        })
        .then(totalCount => {
            console.log("total post count: ", totalCount);
            console.log("now lets try to load it with same repository method:");
            
            return postRepository.findAndCount();
        })
        .then(entitiesWithCount => {
            console.log("items: ", entitiesWithCount[0]);
            console.log("count: ", entitiesWithCount[1]);

        })
        .catch(error => console.log("Cannot save. Error: ", error.stack ? error.stack : error));

}, error => console.log("Cannot connect: ", error.stack ? error.stack : error));
