const { PackageAddition } = require('./PackageAddition');
const { pythonInfo } = require('./packageInfo');
const { currentPullRequest } = require('./PullRequest');

class PythonRequirements {
  constructor(dependencyFile) {
    this.dependencyFile = dependencyFile;
  }

  async findNewPackages() {
    const requirementsDiff = await currentPullRequest.getDiffFor(
      this.dependencyFile,
    );
    const newRequirements = checkNewRequirements(requirementsDiff);
    return newRequirements;
  }
}

module.exports = {
  PythonRequirements,
};

function firstIndexOf(str, searchStrings) {
  const indexes = searchStrings.map((searchStr) => {
    if (str.includes(searchStr)) {
      return str.indexOf(searchStr);
    }

    return Number.MAX_VALUE;
  });

  const index = Math.min(...indexes);
  return index === Number.MAX_VALUE ? null : index;
}

function lastIndexOf(str, searchStrings) {
  const indexes = searchStrings.map((searchStr) => {
    if (str.includes(searchStr)) {
      return str.lastIndexOf(searchStr);
    }

    return Number.MIN_VALUE;
  });

  const index = Math.max(...indexes);
  return index === Number.MIN_VALUE ? null : index;
}

function parseRequirementFromChange(requirementChange) {
  // remove + or - of change
  const requirementLine = requirementChange.slice(1);
  // find end of requirement name
  const delimeters = ['[', ']', '=', '<', '>'];
  const endOfNameIndex = firstIndexOf(requirementLine, delimeters);
  const startOfVersionIndex = lastIndexOf(requirementLine, delimeters);
  const name =
    endOfNameIndex !== null
      ? requirementLine.slice(0, endOfNameIndex)
      : requirementLine;
  const version =
    startOfVersionIndex !== null
      ? requirementLine.slice(startOfVersionIndex + 1)
      : requirementLine;
  return { name, version };
}

async function checkNewRequirements(requirementsDiff) {
  if (!requirementsDiff) {
    return [];
  }

  const diffChunks = requirementsDiff.chunks || [];
  const removedRequirements = new Set();
  for (let chunk of diffChunks) {
    for (let change of chunk.changes) {
      if (change.type === 'del') {
        const removed = parseRequirementFromChange(change.content);
        removedRequirements.add(removed.name);
      }
    }
  }

  const newRequirements = [];
  // add packages for new lines
  for (let chunk of diffChunks) {
    for (let change of chunk.changes) {
      if (change.type === 'add') {
        const added = parseRequirementFromChange(change.content);
        if (removedRequirements.has(added.name) === false) {
          const packageInfo = await pythonInfo(added.name);
          newRequirements.push(
            new PackageAddition(
              change.ln,
              added.name,
              added.version,
              packageInfo ? packageInfo.License : 'failed',
              packageInfo ? packageInfo.URL : 'failed',
            ),
          );
        }
      }
    }
  }

  return newRequirements;
}
