"use strict";
const Generator = require("yeoman-generator");
const chalk = require("chalk");
const yosay = require("yosay");

module.exports = class extends Generator {
  async prompting() {
    this.log(
      yosay(
        `Welcome to the ${chalk.red("generator-cas-app")} generator!
        This generator will set up:
          1) Your asdf package manager https://asdf-vm.com/ .tool-versions file
          2) Your requirements.txt file
          3) Your Makefile`
      )
    );

    this.answers = await this.prompt([
      {
        type: "input",
        name: "projectName",
        message: "Project name:",
        default: this.appname
      },
      {
        type: "input",
        name: "committerEmail",
        message: "Email address associated to your GitHub account"
      },
      {
        type: "input",
        name: "committerName",
        message: "Name associated to your GitHub account?"
      },
      {
        type: "input",
        name: "orgName",
        message: "GitHub organisation",
        default: "bcgov"
      },
      {
        type: "input",
        name: "repoName",
        message: "Repository name"
      },
      {
        type: "input",
        name: "databaseName",
        message: "Database name",
        default: answers => answers.projectName
      },
      {
        type: "input",
        name: "schemaName",
        message: "Database schema name",
        default: answers => answers.projectName
      },
      {
        type: "input",
        name: "nodejs",
        message: "node.js version",
        default: "14.17.6"
      },
      {
        type: "input",
        name: "yarn",
        message: "yarn version",
        default: "1.22.10"
      },
      {
        type: "input",
        name: "postgres",
        message: "postgres version",
        default: "12.6"
      },
      {
        type: "input",
        name: "python",
        message: "python version",
        default: "3.9.2"
      }
    ]);
  }

  writing() {
    this.fs.copyTpl(this.templatePath("."), this.destinationPath("."), {
      ...this.answers
    });

    // This.fs.copy(
    //   this.templatePath("requirements.txt"),
    //   this.destinationPath("requirements.txt")
    // );

    // this.fs.copy(
    //   this.templatePath("Makefile"),
    //   this.destinationPath("Makefile")
    // );
  }

  install() {
    this.spawnCommand("make", ["install_dev_tools"]);
  }
};
