const path = require("path");
const assert = require("yeoman-assert");
const helpers = require("yeoman-test");
const { spawnSync } = require("child_process");

describe("generator-cas-app:app", () => {
  beforeAll(
    () =>
      helpers.run(path.join(__dirname, "../generators/app")).withPrompts({
        nodejs: "16.14.2",
        yarn: "1.22.5",
        postgres: "14.2",
        python: "3.9.2",
        projectName: "abcd",
        committerEmail: "foo@bar.com",
        committerName: "Foo Bar",
      }),
    3600000
  );

  it("creates files", () => {
    assert.file([".tool-versions"]);
    assert.file(["requirements.txt"]);
    assert.file(["Makefile"]);
  });

  it("passes database unit tests", () => {
    const { status } = spawnSync("make", ["db_unit_tests"], {
      stdio: "inherit",
    });

    assert.equal(status, 0);
  });
});
