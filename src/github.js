require('dotenv').config();

if (process.env.NODE_ENV === 'development') {
  const MockCore = {
    info: console.log,
    setFailed(errorMessage) {
      console.error(`Failed: ${errorMessage}`);
    },
    getInput(inputName) {
      return MockInputs[inputName];
    },
  };
  const MockInputs = {
    'dependency-file': 'package.json',
    'message-file': './new-package-warning.md',
  };
  const { Octokit } = require('octokit');
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  module.exports = { core: MockCore, octokit, pulls: octokit.rest.pulls };
} else {
  const core = require('@actions/core');
  const { Octokit } = require('@octokit/action');
  const octokit = new Octokit();

  module.exports = { core, octokit, pulls: octokit.rest.pulls };
}
