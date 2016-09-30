describe("ModulesUsingParallelRegistry", function () {
    describe("version", function () {
        it("returns the current version");
    });

    describe("modules", function () {
        it("returns an empty array by default");
        it("returns an array containing the modules");
    });

    describe("add", function () {
        it("registers the module");
        it("freezes the module");
        it("increases the version");
    });

    describe("remove", function () {
        it("returns false if the module is not registered");
        it("does not change the version if the module was not registered");
        it("removes the module if it has been registered");
    });

    describe("has", function () {
        it("returns false if the registry does not contain the module with the given filename");
        it("returns true if the registry contains the module with the given filename");
    });

    describe("get", function () {
        it("returns undefined if the module is not registered");
        it("returns the module if registered");
    });
});
