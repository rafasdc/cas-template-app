"use strict";
const path = require("path");
const assert = require("yeoman-assert");
const helpers = require("yeoman-test");

describe("generator-cas-app:app", () => {
  beforeAll(() => {
    return helpers.run(path.join(__dirname, "../generators/app")).withPrompts({
      nodejs: "14.17.6",
      yarn: "1.22.5",
      postgres: "12.6",
      python: "3.9.2"
    });
  });

  it("creates files", () => {
    assert.file([".tool-versions"]);
    assert.file(["requirements.txt"]);
    assert.file(["Makefile"]);
  });
});
