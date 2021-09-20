'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');

module.exports = class extends Generator {
  prompting() {
    // Have Yeoman greet the user.
    this.log(
      yosay(
        `Welcome to the ${chalk.red('generator-cas-app')} generator! This generator will set up your asdf package manager https://asdf-vm.com/`
      )
    );

    const prompts = [
      {
        type: 'confirm',
        name: 'someAnswer',
        message: 'Would you like to enable this option?',
        default: true
      }
    ];

    return this.prompt(prompts).then(props => {
      // To access props later use this.props.someAnswer;
      this.props = props;
    });
  }

  writing() {
    this.fs.copyTpl(
      this.templatePath('.tool-versions'),
      this.destinationPath('.tool-versions'),
      {
        nodejs: '14.17.6',
        yarn: '1.22.5',
        postgres: '12.6',
        python: '3.9.2'
      }
    );
  }

  // install() {
  //   this.installDependencies();
  // }
};
