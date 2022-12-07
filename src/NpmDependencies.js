/* eslint-disable no-regex-spaces */
const { currentWorkspace } = require('./GithubWorkspace');
const { npmInfo } = require('./packageInfo');
const { PackageAddition } = require('./PackageAddition');
const { currentPullRequest } = require('./PullRequest');

const ADD_PACKAGE_MATCH_REGEX = /\+    "(.*)": "(.*)"/;
const REMOVE_PACKAGE_MATCH_REGEX = /-    "(.*)": "(.*)"/;

async function checkNpmNewPackages(packageJsonDiff, dependencies) {
  if (!packageJsonDiff) {
    return [];
  }

  const diffChunks = packageJsonDiff.chunks || [];
  const removedPackages = new Set();
  for (let chunk of diffChunks) {
    for (let change of chunk.changes) {
      if (change.type === 'del') {
        const match = change.content.match(REMOVE_PACKAGE_MATCH_REGEX);
        if (match !== null) {
          const [, packageName] = match;
          if (dependencies[packageName]) {
            removedPackages.add(packageName);
          }
        }
      }
    }
  }

  const newPackages = [];
  // add packages for new lines
  for (let chunk of diffChunks) {
    for (let change of chunk.changes) {
      if (change.type === 'add') {
        const match = change.content.match(ADD_PACKAGE_MATCH_REGEX);
        if (match !== null) {
          const [, packageName, packageVersion] = match;
          if (
            dependencies[packageName] &&
            removedPackages.has(packageName) === false
          ) {
            const { license, homepage } = await npmInfo(packageName);
            newPackages.push(
              new PackageAddition(
                change.ln,
                packageName,
                packageVersion,
                license || '-',
                homepage || '-',
              ),
            );
          }
        }
      }
    }
  }

  return newPackages;
}

class NpmDependencies {
  constructor(dependencyFile) {
    this.dependencyFile = dependencyFile;
  }

  async load() {
    const packageJson = await currentWorkspace.getFile(this.dependencyFile);
    const packageConfig = JSON.parse(packageJson);
    this.dependencies = {
      ...packageConfig.dependencies,
      ...packageConfig.devDependencies,
    };
  }

  async findNewPackages() {
    if (!this.dependencies) {
      await this.load();
    }

    const dependencyDiff = await currentPullRequest.getDiffFor(
      this.dependencyFile,
    );

    if (!dependencyDiff) {
      return [];
    }

    this.newPackages = await checkNpmNewPackages(
      dependencyDiff,
      this.dependencies,
    );
    return this.newPackages;
  }
}

module.exports = { NpmDependencies };
