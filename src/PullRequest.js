const parseDiff = require('parse-diff');

const { core, octokit, pulls } = require('./action');

class PullRequest {
  constructor(pullNumber, { owner, repo }) {
    this.owner = owner;
    this.repo = repo;
    this.pullNumber = pullNumber;
  }

  async getDiffFor(filePath) {
    if (!this.diff) {
      await this.loadDiff();
    }

    return this.diff.find((file) => {
      if (file.from === filePath) {
        return true;
      }
    });
  }

  async addComment(comment) {
    if (this.doesCommentExist(comment)) {
      core.info('Comment exists -- skipping');
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

    core.info(`Loading diff from github: ${this.pullNumber}`);
    const res = await pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: this.pullNumber,
      mediaType: {
        format: 'diff',
      },
    });
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

const currentPullRequest = new PullRequest(parsePullNumber(), parseRepo());

module.exports = {
  PullRequest,
  currentPullRequest,
};
