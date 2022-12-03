const Mustache = require('mustache');
const path = require('path');

const { core } = require('./github');
const { PullRequest } = require('./PullRequest');

async function run() {
  try {
    const dependencyFile = core.getInput('dependency-file');
    const pr = await PullRequest.current();
    const messageTemplate = await getMessageTemplate(pr);
    const newPackages = await pr.checkNewPackages(dependencyFile);
    core.info(`${newPackages.length} new packages found`);
    for (const newPackage of newPackages) {
      const body = Mustache.render(messageTemplate, newPackage);
      core.info(`Posting comment: \n\n${body}`);
      await pr.addComment({
        path: dependencyFile,
        line: newPackage.lineNumber,
        body,
      });
    }
  } catch (error) {
    console.error(error);
    core.setFailed(error.message);
  }
}

async function getMessageTemplate(pr) {
  const messageFile = core.getInput('message-file');
  const messageFilePath =
    messageFile.indexOf('./') === 0
      ? path.join('.github', 'workflows', messageFile)
      : messageFile;
  core.info(`Reading message template from: ${messageFilePath}`);
  return await pr.getFile(messageFilePath);
}

run();
