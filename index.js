const express = require("express");
const bodyParser = require("body-parser");
const config = require("config");

const github = require("./lib/github");
const verifySignature = require("./lib/hmac");

const { secret } = config.get("github.webhook");
const PORT = process.env.PORT || 5000;

/**
 * Install a webhook to our Organization to invoke this webservice
 */
async function initWebhook() {
  const webhooks = await github.getWebhooks();

  // find existing webhook for enforcer
  const webhook = webhooks.find(hook => hook.config.url.indexOf("/api/enforcer/v1/webhook"));

  if (webhook) {
    return github.updateWebhook(webhook.id);
  } else {
    return github.createWebhook();
  }
}
/**
 * Respond with HTTP 404
 *
 * @param {ServerResponse} res
 */
function notFound(res) {
  return res.status(404).send();
}

/**
 * Handle incoming webkhook for repository creation.
 *
 * @param {object} event
 */
async function handleEvent(event) {
  const { full_name, owner } = event.repository;
  // repo create hooks fire before the branch is created.
  // this helps work around the race-condition
  await github.waitForBranch(full_name);
  await github.protectBranch(full_name);
  const { number } = await github.createIssue(full_name, owner.login);
  await github.closeIssue(full_name, number);
}

/**
 * Main handler for HTTP requests from GitHub
 *
 * @param {ClientRequest} req
 * @param {ServerResponse} res
 */
function handleWebhook(req, res) {
  const { body, headers } = req;

  const event = headers["x-github-event"];
  const { action } = body;

  // For now, only handle one event type and action
  if (event === "repository" && action === "created") {
    const [algo, signature] = headers["x-hub-signature"].split("=");
    const valid = verifySignature(JSON.stringify(body), signature, algo, secret);

    if (valid) {
      handleEvent(body);
      res.status(202).send();
    } else {
      console.error(`invalid signature`);
      notFound(res);
    }
  } else {
    console.error(`we don't handle this event or action ${event} - ${action}`);
    notFound(res);
  }
}

(async () => {
  await initWebhook();

  express()
    .use(bodyParser.json())
    .post("/api/enforcer/v1/webhook", handleWebhook)
    .listen(PORT, () => console.log(`Listening on ${PORT}`));
})();
