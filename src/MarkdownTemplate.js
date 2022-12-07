const Mustache = require('mustache');
const path = require('path');

const { currentWorkspace } = require('./GithubWorkspace');

class MarkdownTemplate {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async loadTemplate() {
    const realFilePath =
      this.filePath.indexOf('./') === 0
        ? path.join('.github', 'workflows', this.filePath)
        : this.filePath;
    this.template = await currentWorkspace.getFile(realFilePath);
  }

  async render(data) {
    if (!this.template) {
      await this.loadTemplate();
    }

    return Mustache.render(this.template, data);
  }
}

module.exports = {
  MarkdownTemplate,
};
