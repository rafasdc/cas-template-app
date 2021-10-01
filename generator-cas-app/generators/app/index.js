const Generator = require("yeoman-generator");
const chalk = require("chalk");
const yosay = require("yosay");

module.exports = class extends Generator {
  async prompting() {
    this.log(
      yosay(
        `Welcome to the ${chalk.red("cas-app")} generator!
        This generator will set up:
          1) Your asdf package manager https://asdf-vm.com/ .tool-versions file
          2) A Makefile with useful commands
          3) A set of database migrations for your app`
      )
    );

    this.answers = await this.prompt([
      {
        type: "input",
        name: "projectName",
        message: "Project name (use snake_case, preferably a short acronym)",
        default: this.appname.replace(" ", "_"),
      },
      {
        type: "input",
        name: "committerEmail",
        message: "Email address associated to your GitHub account",
        store: true,
      },
      {
        type: "input",
        name: "committerName",
        message: "Name associated to your GitHub account",
        store: true,
      },
      {
        type: "input",
        name: "orgName",
        message: "GitHub organisation",
        default: "bcgov",
      },
      {
        type: "input",
        name: "repoName",
        message: "Repository name (use kebab-case)",
        default: (answers) => answers.projectName.replace("_", "-"),
      },
      {
        type: "input",
        name: "dbName",
        message: "Database name",
        default: (answers) => answers.projectName,
      },
      {
        type: "input",
        name: "schemaName",
        message: "Database schema name",
        default: (answers) => answers.projectName,
      },
      {
        type: "input",
        name: "adminRole",
        message: "Administrator database role",
        default: (answers) => `${answers.projectName}_admin`,
      },
      {
        type: "input",
        name: "guestRole",
        message: "Guest role",
        default: (answers) => `${answers.projectName}_guest`,
      },
      {
        type: "input",
        name: "nonAdminRoles",
        message: "Other roles requiring authentication (comma separated)",
        default: (answers) =>
          [
            `${answers.projectName}_internal`,
            `${answers.projectName}_external`,
          ].join(","),
      },
      {
        type: "input",
        name: "nodejs",
        message: "node.js version",
        default: "14.17.6",
      },
      {
        type: "input",
        name: "yarn",
        message: "yarn version",
        default: "1.22.10",
      },
      {
        type: "input",
        name: "postgres",
        message: "postgres version",
        default: "12.6",
      },
      {
        type: "input",
        name: "python",
        message: "python version",
        default: "3.9.2",
      },
    ]);
  }

  writing() {
    const nonAdminRoles = this.answers.nonAdminRoles.split(",");
    const { adminRole, guestRole, projectName } = this.answers;
    const templateVars = {
      ...this.answers,
      authenticatedRoles: [...nonAdminRoles, adminRole],
      roles: [...nonAdminRoles, adminRole, guestRole],
      nonAdminRoles,
      userTable: `${projectName}_user`,
    };

    this.fs.copyTpl(
      this.templatePath("."),
      this.destinationPath("."),
      templateVars
    );
    this.fs.copyTpl(
      this.templatePath(".*"),
      this.destinationPath("."),
      templateVars
    );
  }

  install() {
    this.spawnCommandSync("make", ["install_dev_tools"]);
  }

  end() {
    this.log(
      yosay(
        `Your app is ready!
        Check out the available commands with:
          $ make help`
      )
    );
  }
};
