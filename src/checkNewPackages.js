/* eslint-disable no-regex-spaces */
const { npmInfo } = require('./npmInfo');

const ADD_PACKAGE_MATCH_REGEX = /\+    "(.*)": "(.*)"/;
const REMOVE_PACKAGE_MATCH_REGEX = /-    "(.*)": "(.*)"/;

class PackageAddition {
  constructor(lineNumber, name, version, license, homepage) {
    this.lineNumber = lineNumber;
    this.name = name;
    this.version = version;
    this.license = license;
    this.homepage = homepage;
  }
}

async function checkNewPackages(packageJsonDiff, dependencies) {
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

module.exports = checkNewPackages;
