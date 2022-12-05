const fs = require('fs/promises');
const parseDiff = require('parse-diff');
const path = require('path');

const checkNewPackages = require('./checkNewPackages');
const { core, octokit, pulls } = require('./github');

class PullRequest {
  static async current() {
    const pullNumber = parsePullNumber();
    const { owner, repo } = parseRepo();
    const pullRequest = new PullRequest(pullNumber, owner, repo);
    await this.load();
    return pullRequest;
  }

  constructor(pullNumber, owner, repo) {
    this.owner = owner;
    this.repo = repo;
    this.pullNumber = pullNumber;
  }

  async checkNewPackages(dependencyFile) {
    console.assert(this.diff, 'Pull request diff has not been loaded');
    const dependencyDiff = this.diff.find((file) => {
      if (file.from === dependencyFile) {
        return true;
      }
    });

    const packageJson = await this.getFile(dependencyFile);
    const packageConfig = JSON.parse(packageJson);
    const dependencies = {
      ...packageConfig.dependencies,
      ...packageConfig.devDependencies,
    };
    this.newPackages = await checkNewPackages(dependencyDiff, dependencies);
    return this.newPackages;
  }

  async addComment(comment) {
    if (this.doesCommentExist(comment)) {
      console.log('Comment exists -- skipping');
      return;
    }

    await pulls.createReviewComment({
      owner: this.owner,
      repo: this.repo,
      pull_number: this.pullNumber,
      body: comment.body,
      line: comment.line,
      path: comment.path,
      commit_id: this.headSha,
    });
  }

  doesCommentExist(comment) {
    for (let existingComment of this.comments) {
      if (
        comment.line === existingComment.line &&
        comment.path === existingComment.path &&
        comment.body === existingComment.body
      ) {
        return true;
      }
    }

    return false;
  }

  get headSha() {
    console.assert(this.pull, 'Pull request has not been loaded');
    return this.pull.head.sha;
  }

  async getFile(file) {
    // const filePath = [this.owner, this.repo, this.headSha, file].join('/');
    // const fileUrl = `https://raw.githubusercontent.com/${filePath}`;
    // const res = await octokit.request(fileUrl);
    const fileBuffer = await fs.readFile(
      path.join(process.env.GITHUB_WORKSPACE, file),
    );
    return fileBuffer.toString('utf-8');
  }

  async load() {
    await this.loadPull();
    await this.loadDiff();
    await this.loadComments();
  }

  async loadPull() {
    core.info(`Loading pull from github: ${this.pullNumber}`);
    const res = await pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: this.pullNumber,
    });
    this.pull = res.data;
  }

  async loadDiff() {
    if (!this.pull) {
      await this.loadPull();
    }

    core.info(`Loading diff from github: ${this.pull.diff_url}`);
    const res = await octokit.request(this.pull.diff_url);
    this.diff = parseDiff(res.data);
  }

  async loadComments() {
    if (!this.pull) {
      await this.loadPull();
    }

    core.info(
      `Loading review comments from github: ${this.pull.review_comments_url}`,
    );
    const res = await octokit.request(this.pull.review_comments_url);
    this.comments = res.data;
  }
}

const parseRepo = () => {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  return { owner, repo };
};

const parsePullNumber = () => {
  const result = /refs\/pull\/(\d+)\/merge/g.exec(process.env.GITHUB_REF);
  if (!result) throw new Error('Reference not found.');
  const [, pullRequestId] = result;
  return pullRequestId;
};

module.exports = {
  PullRequest,
};
