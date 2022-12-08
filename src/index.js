const { core } = require('./action');
const { MarkdownTemplate } = require('./MarkdownTemplate');
const { NewPackageFinder } = require('./NewPackageFinder');
const { currentPullRequest } = require('./PullRequest');

async function run() {
  try {
    const dependencyFile = core.getInput('dependency-file');
    const newPackageFinder = new NewPackageFinder(dependencyFile);
    const newPackages = await newPackageFinder.find();
    if (newPackages === null) {
      return;
    }

    console.log(`${newPackages.length} new packages found`);

    const newPackageMessage = new MarkdownTemplate(
      core.getInput('message-file'),
    );
    for (const newPackage of newPackages) {
      const body = await newPackageMessage.render(newPackage);
      console.log(`Posting comment: \n\n${body}`);
      await currentPullRequest.addComment({
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

run();
