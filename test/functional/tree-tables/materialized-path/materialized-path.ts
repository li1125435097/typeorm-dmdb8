import "reflect-metadata";
import {Category} from "./entity/Category";
import {Connection} from "../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Product} from "./entity/Product";

describe("tree tables > materialized-path", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Product, Category],
        logging: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("attach should work properly", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);

        const a1 = new Category();
        a1.name = "a1";
        await categoryRepository.save(a1);

        const a11 = new Category();
        a11.name = "a11";
        a11.parentCategory = a1;
        await categoryRepository.save(a11);

        const a111 = new Category();
        a111.name = "a111";
        a111.parentCategory = a11;
        await categoryRepository.save(a111);

        const a12 = new Category();
        a12.name = "a12";
        a12.parentCategory = a1;
        await categoryRepository.save(a12);

        const rootCategories = await categoryRepository.findRoots();
        rootCategories.should.be.eql([{
            id: 1,
            name: "a1"
        }]);

        const a11Parent = await categoryRepository.findAncestors(a11);
        a11Parent.length.should.be.equal(2);
        a11Parent.should.deep.include({id: 1, name: "a1"});
        a11Parent.should.deep.include({id: 2, name: "a11"});

        const a1Children = await categoryRepository.findDescendants(a1);
        a1Children.length.should.be.equal(4);
        a1Children.should.deep.include({id: 1, name: "a1"});
        a1Children.should.deep.include({id: 2, name: "a11"});
        a1Children.should.deep.include({id: 3, name: "a111"});
        a1Children.should.deep.include({id: 4, name: "a12"});
    })));

    it("categories should be attached via children and saved properly", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);

        const a1 = new Category();
        a1.name = "a1";
        await categoryRepository.save(a1);

        const a11 = new Category();
        a11.name = "a11";

        const a12 = new Category();
        a12.name = "a12";

        a1.childCategories = [a11, a12];
        await categoryRepository.save(a1);

        const rootCategories = await categoryRepository.findRoots();
        rootCategories.should.be.eql([{
            id: 1,
            name: "a1"
        }]);

        const a11Parent = await categoryRepository.findAncestors(a11);
        a11Parent.length.should.be.equal(2);
        a11Parent.should.deep.include({id: 1, name: "a1"});
        a11Parent.should.deep.include({id: 2, name: "a11"});

        const a1Children = await categoryRepository.findDescendants(a1);
        a1Children.length.should.be.equal(3);
        a1Children.should.deep.include({id: 1, name: "a1"});
        a1Children.should.deep.include({id: 2, name: "a11"});
        a1Children.should.deep.include({id: 3, name: "a12"});
    })));

    it("categories should be attached via children and saved properly", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);

        const a1 = new Category();
        a1.name = "a1";
        await categoryRepository.save(a1);

        const a11 = new Category();
        a11.name = "a11";

        const a12 = new Category();
        a12.name = "a12";

        a1.childCategories = [a11, a12];
        await categoryRepository.save(a1);

        const rootCategories = await categoryRepository.findRoots();
        rootCategories.should.be.eql([{
            id: 1,
            name: "a1"
        }]);

        const a11Parent = await categoryRepository.findAncestors(a11);
        a11Parent.length.should.be.equal(2);
        a11Parent.should.deep.include({id: 1, name: "a1"});
        a11Parent.should.deep.include({id: 2, name: "a11"});

        const a1Children = await categoryRepository.findDescendants(a1);
        a1Children.length.should.be.equal(3);
        a1Children.should.deep.include({id: 1, name: "a1"});
        a1Children.should.deep.include({id: 2, name: "a11"});
        a1Children.should.deep.include({id: 3, name: "a12"});
    })));

    it("categories should be attached via children and saved properly and everything must be saved in cascades", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);

        const a1 = new Category();
        a1.name = "a1";

        const a11 = new Category();
        a11.name = "a11";

        const a12 = new Category();
        a12.name = "a12";

        const a111 = new Category();
        a111.name = "a111";

        const a112 = new Category();
        a112.name = "a112";

        a1.childCategories = [a11, a12];
        a11.childCategories = [a111, a112];
        await categoryRepository.save(a1);

        const rootCategories = await categoryRepository.findRoots();
        rootCategories.should.be.eql([{
            id: 1,
            name: "a1"
        }]);

        const a11Parent = await categoryRepository.findAncestors(a11);
        a11Parent.length.should.be.equal(2);
        a11Parent.should.deep.include({id: 1, name: "a1"});
        a11Parent.should.deep.include({id: 2, name: "a11"});

        const a1Children = await categoryRepository.findDescendants(a1);
        const a1ChildrenNames = a1Children.map(child => child.name);
        a1ChildrenNames.length.should.be.equal(5);
        a1ChildrenNames.should.deep.include("a1");
        a1ChildrenNames.should.deep.include("a11");
        a1ChildrenNames.should.deep.include("a12");
        a1ChildrenNames.should.deep.include("a111");
        a1ChildrenNames.should.deep.include("a112");
    })));

    it("findTrees() tests > findTrees should load all category roots and attached children", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);

        const a1 = new Category();
        a1.name = "a1";

        const a11 = new Category();
        a11.name = "a11";

        const a12 = new Category();
        a12.name = "a12";

        const a111 = new Category();
        a111.name = "a111";

        const a112 = new Category();
        a112.name = "a112";

        a1.childCategories = [a11, a12];
        a11.childCategories = [a111, a112];
        await categoryRepository.save(a1);

        const categoriesTree = await categoryRepository.findTrees();
        categoriesTree.should.be.eql([
            {
                id: a1.id,
                name: "a1",
                childCategories: [
                    {
                        id: a11.id,
                        name: "a11",
                        childCategories: [
                            {
                                id: a111.id,
                                name: "a111",
                                childCategories: []
                            },
                            {
                                id: a112.id,
                                name: "a112",
                                childCategories: []
                            }
                        ]
                    },
                    {
                        id: a12.id,
                        name: "a12",
                        childCategories: []
                    }
                ]
            }
        ]);
    })));

    it("findTrees() testsfindTrees should load multiple category roots if they exist", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);

        const a1 = new Category();
        a1.name = "a1";

        const a11 = new Category();
        a11.name = "a11";

        const a12 = new Category();
        a12.name = "a12";

        const a111 = new Category();
        a111.name = "a111";

        const a112 = new Category();
        a112.name = "a112";

        a1.childCategories = [a11, a12];
        a11.childCategories = [a111, a112];
        await categoryRepository.save(a1);

        const b1 = new Category();
        b1.name = "b1";

        const b11 = new Category();
        b11.name = "b11";

        const b12 = new Category();
        b12.name = "b12";

        b1.childCategories = [b11, b12];
        await categoryRepository.save(b1);

        const categoriesTree = await categoryRepository.findTrees();
        categoriesTree.should.be.eql([
            {
                id: a1.id,
                name: "a1",
                childCategories: [
                    {
                        id: a11.id,
                        name: "a11",
                        childCategories: [
                            {
                                id: a111.id,
                                name: "a111",
                                childCategories: []
                            },
                            {
                                id: a112.id,
                                name: "a112",
                                childCategories: []
                            }
                        ]
                    },
                    {
                        id: a12.id,
                        name: "a12",
                        childCategories: []
                    }
                ]
            }, {
                id: b1.id,
                name: "b1",
                childCategories: [
                    {
                        id: b11.id,
                        name: "b11",
                        childCategories: []
                    },
                    {
                        id: b12.id,
                        name: "b12",
                        childCategories: []
                    }
                ]
            }
        ]);
    })));

    it("findTrees() testsfindTrees should filter by depth if optionally provided", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);

        const a1 = new Category();
        a1.name = "a1";

        const a11 = new Category();
        a11.name = "a11";

        const a12 = new Category();
        a12.name = "a12";

        const a111 = new Category();
        a111.name = "a111";

        const a112 = new Category();
        a112.name = "a112";

        a1.childCategories = [a11, a12];
        a11.childCategories = [a111, a112];
        await categoryRepository.save(a1);

        const categoriesTree = await categoryRepository.findTrees();
        categoriesTree.should.be.eql([
            {
                id: a1.id,
                name: "a1",
                childCategories: [
                    {
                        id: a11.id,
                        name: "a11",
                        childCategories: [
                            {
                                id: a111.id,
                                name: "a111",
                                childCategories: []
                            },
                            {
                                id: a112.id,
                                name: "a112",
                                childCategories: []
                            }
                        ]
                    },
                    {
                        id: a12.id,
                        name: "a12",
                        childCategories: []
                    }
                ]
            }
        ]);

        const categoriesTreeWithEmptyOptions = await categoryRepository.findTrees({});
        categoriesTreeWithEmptyOptions.should.be.eql([
            {
                id: a1.id,
                name: "a1",
                childCategories: [
                    {
                        id: a11.id,
                        name: "a11",
                        childCategories: [
                            {
                                id: a111.id,
                                name: "a111",
                                childCategories: []
                            },
                            {
                                id: a112.id,
                                name: "a112",
                                childCategories: []
                            }
                        ]
                    },
                    {
                        id: a12.id,
                        name: "a12",
                        childCategories: []
                    }
                ]
            }
        ]);

        const categoriesTreeWithDepthZero = await categoryRepository.findTrees({depth: 0});
        categoriesTreeWithDepthZero.should.be.eql([
            {
                id: a1.id,
                name: "a1",
                childCategories: []
            }
        ]);

        const categoriesTreeWithDepthOne = await categoryRepository.findTrees({depth: 1});
        categoriesTreeWithDepthOne.should.be.eql([
            {
                id: a1.id,
                name: "a1",
                childCategories: [
                    {
                        id: a11.id,
                        name: "a11",
                        childCategories: []
                    },
                    {
                        id: a12.id,
                        name: "a12",
                        childCategories: []
                    }
                ]
            }
        ]);
    })));

    it("findDescendantsTree() tests > findDescendantsTree should load all category descendents and nested children", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);

        const a1 = new Category();
        a1.name = "a1";

        const a11 = new Category();
        a11.name = "a11";

        const a12 = new Category();
        a12.name = "a12";

        const a111 = new Category();
        a111.name = "a111";

        const a112 = new Category();
        a112.name = "a112";

        a1.childCategories = [a11, a12];
        a11.childCategories = [a111, a112];
        await categoryRepository.save(a1);

        const categoriesTree = await categoryRepository.findDescendantsTree(a1);
        categoriesTree.should.be.eql({
            id: a1.id,
            name: "a1",
            childCategories: [
                {
                    id: a11.id,
                    name: "a11",
                    childCategories: [
                        {
                            id: a111.id,
                            name: "a111",
                            childCategories: []
                        },
                        {
                            id: a112.id,
                            name: "a112",
                            childCategories: []
                        }
                    ]
                },
                {
                    id: a12.id,
                    name: "a12",
                    childCategories: []
                }
            ]
        });
    })));

    it("findDescendantsTree should filter by depth if optionally provided", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);

        const a1 = new Category();
        a1.name = "a1";

        const a11 = new Category();
        a11.name = "a11";

        const a12 = new Category();
        a12.name = "a12";

        const a111 = new Category();
        a111.name = "a111";

        const a112 = new Category();
        a112.name = "a112";

        a1.childCategories = [a11, a12];
        a11.childCategories = [a111, a112];
        await categoryRepository.save(a1);

        const categoriesTree = await categoryRepository.findDescendantsTree(a1);
        categoriesTree.should.be.eql({
            id: a1.id,
            name: "a1",
            childCategories: [
                {
                    id: a11.id,
                    name: "a11",
                    childCategories: [
                        {
                            id: a111.id,
                            name: "a111",
                            childCategories: []
                        },
                        {
                            id: a112.id,
                            name: "a112",
                            childCategories: []
                        }
                    ]
                },
                {
                    id: a12.id,
                    name: "a12",
                    childCategories: []
                }
            ]
        });

        const categoriesTreeWithEmptyOptions = await categoryRepository.findDescendantsTree(a1, {});
        categoriesTreeWithEmptyOptions.should.be.eql({
            id: a1.id,
            name: "a1",
            childCategories: [
                {
                    id: a11.id,
                    name: "a11",
                    childCategories: [
                        {
                            id: a111.id,
                            name: "a111",
                            childCategories: []
                        },
                        {
                            id: a112.id,
                            name: "a112",
                            childCategories: []
                        }
                    ]
                },
                {
                    id: a12.id,
                    name: "a12",
                    childCategories: []
                }
            ]
        });

        const categoriesTreeWithDepthZero = await categoryRepository.findDescendantsTree(a1, {depth: 0});
        categoriesTreeWithDepthZero.should.be.eql({
            id: a1.id,
            name: "a1",
            childCategories: []
        });

        const categoriesTreeWithDepthOne = await categoryRepository.findDescendantsTree(a1, {depth: 1});
        categoriesTreeWithDepthOne.should.be.eql({
            id: a1.id,
            name: "a1",
            childCategories: [
                {
                    id: a11.id,
                    name: "a11",
                    childCategories: []
                },
                {
                    id: a12.id,
                    name: "a12",
                    childCategories: []
                }
            ]
        });
    })));

    it("should compute path correctly when tree is implicitly saved (cascade: true) through related entity", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getRepository(Category);
        const productRepository = connection.getRepository(Product);

        // first increment the category primary id once by saving and removing an item
        // this is necessary to reproduce the bug behaviour
        const existingCategory = new Category();
        existingCategory.name = "irrelevant";
        await categoryRepository.save(existingCategory);
        await categoryRepository.delete(existingCategory);

        // set up a product with category tree `{name: "My product", categories: [{name: "root", children: [{name: "child"}]}]}`
        const childCategory = new Category();
        childCategory.name = "child";
        const rootCategory = new Category();
        rootCategory.name = "root";
        rootCategory.childCategories = [childCategory];
        const product = new Product();
        product.name = "My product";
        product.categories = [rootCategory];

        // save it alongside its categories ( cascade )
        const savedProduct = await productRepository.save(product);
        const pathResult = await connection.createQueryBuilder()
            .select("category.mpath", "mpath")
            .from("categories", "category")
            .where("category.product = :id")
            .setParameters({ id: savedProduct.id })
            .getRawOne();

        pathResult.mpath.should.not.match(/^undefined/);
    })));
});
