const { readFile } = require('fs/promises');
const path = require('path');

class GithubWorkspace {
  constructor(path) {
    this.path = path;
  }

  async getFile(file) {
    const fullPath = path.join(this.path, file);
    console.log(`Reading workspace file: ${fullPath}`);
    const fileBuffer = await readFile(fullPath);
    return fileBuffer.toString('utf-8');
  }
}

const currentWorkspace = new GithubWorkspace(process.env.GITHUB_WORKSPACE);

module.exports = {
  currentWorkspace,
  GithubWorkspace,
};
