const assert = require("assert");
const axios = require("axios");
const config = require("config");

const repoDefaults = require("./defaults/repo");
const protectionDefaults = require("./defaults/protection");
const issueDefaults = require("./defaults/issue");
const webhookDefaults = require("./defaults/webhook");

const { url, org, token, mime } = config.get("github");

const client = {};

/**
 * We rely on the repo owner and name being passed in, so validate that.
 *
 * @param {String} repo
 */
function validateRepo(repo) {
  assert(typeof repo === "string", "repo name is required");
  assert(repo.split("/").length === 2, "repo name must be formatted as <user>/<repo>");
}

client.instance = axios.create({
  baseURL: url,
  headers: {
    accept: mime,
    authorization: `bearer ${token}`
  }
});

client.getWebhooks = async function getWebhooks() {
  const { data } = await this.instance.get(`/orgs/${org}/hooks`);
  return data;
};

client.createWebhook = async function createWebhook(webhook) {
  const _webhook = Object.assign({}, webhook, webhookDefaults);

  try {
    const { data } = await this.instance.post(`/orgs/${org}/hooks`, _webhook);
    return data;
  } catch (err) {
    console.error(`error creating webhook`);
    console.error(err);
  }
};

client.updateWebhook = async function updateWebhook(id, webhook) {
  const _webhook = Object.assign({}, webhook, webhookDefaults);

  try {
    const { data } = await this.instance.patch(`/orgs/${org}/hooks/${id}`, _webhook);
    return data;
  } catch (err) {
    console.error(`error updating webhook`);
    console.error(err);
  }
};

client.getRepos = async function getRepos() {
  const { data } = await this.instance.get(`/orgs/${org}/repos`);
  return data;
};

client.createRepo = async function createRepo(repo = {}) {
  const _repo = Object.assign({}, repo, repoDefaults);
  const { data } = await this.instance.post(`/orgs/${org}/repos`, _repo);
  return data;
};

client.deleteRepo = async function deleteRepo(repo) {
  validateRepo(repo);

  const { data } = await this.instance.delete(`/repos/${repo}`);
  return data;
};

/**
 * It appears that GitHub's repository:created event does not wait for a
 * branch to be initialized before firing the create event. We'll need to wait
 * for the branch to appear before we can protect it, and this does just that.
 *
 * @param {string} repo
 * @param {string} branch
 */
client.waitForBranch = async function waitForBranch(repo, branch = "master") {
  let tries = 10;

  for (let i = 0; i < tries; i++) {
    try {
      await new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            await this.instance.get(`/repos/${repo}/branches/${branch}`);
            resolve();
          } catch (err) {
            reject(err);
          }
        }, 1000);
      });

      return true;
    } catch (err) {
      console.log(`waiting for branch ${repo}/branches/${branch}`);
    }
  }

  return false;
};

client.protectBranch = async function protectBranch(repo, branch = "master", protection) {
  validateRepo(repo);

  const _protection = Object.assign({}, protection, protectionDefaults);

  try {
    const { data } = await this.instance.put(`/repos/${repo}/branches/${branch}/protection`, _protection, {
      headers: {
        // required for specifying number of approving pull request reviews
        // https://developer.github.com/v3/repos/branches/#update-branch-protection
        accept: "application/vnd.github.luke-cage-preview+json"
      }
    });
    return data;
  } catch (err) {
    console.error(`error protecting branch ${repo} - ${branch}`);
    console.error(err);
  }
};

client.createIssue = async function createIssue(repo, owner, issue) {
  validateRepo(repo);

  const _issue = Object.assign({}, issue, issueDefaults(owner));

  try {
    const { data } = await this.instance.post(`/repos/${repo}/issues`, _issue);
    return data;
  } catch (err) {
    console.error(`error creating issue ${repo} - ${owner}`);
    console.error(err);
  }
};

client.closeIssue = async function closeIssue(repo, issue) {
  validateRepo(repo);

  const _patch = { state: "closed" };

  try {
    const { data } = await this.instance.patch(`/repos/${repo}/issues/${issue}`, _patch);
    return data;
  } catch (err) {
    console.error(`error closing issue ${repo} - ${issue}`);
  }
};

module.exports = client;
