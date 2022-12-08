const { NpmDependencies } = require('./NpmDependencies');
const { currentPullRequest } = require('./PullRequest');
const { PythonRequirements } = require('./PythonRequirement');

class NewPackageFinder {
  constructor(dependencyFile) {
    this.dependencyFile = dependencyFile;
  }

  async find() {
    await currentPullRequest.load();
    let dependencies;
    if (this.dependencyFile.includes('package.json')) {
      dependencies = new NpmDependencies(this.dependencyFile);
    } else if (this.dependencyFile.includes('requirements.txt')) {
      dependencies = new PythonRequirements(this.dependencyFile);
    } else {
      console.error(
        `Error: dependency file ${this.dependencyFile} not supported`,
      );
      return null;
    }
    const newPackages = await dependencies.findNewPackages();
    return newPackages;
  }
}

module.exports = { NewPackageFinder };
