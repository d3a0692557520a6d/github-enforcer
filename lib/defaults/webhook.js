const config = require("config");
const { url, secret } = config.get("github.webhook");

module.exports = {
  name: "web",
  active: true,
  events: ["repository"],
  config: {
    url,
    secret,
    content_type: "json"
  }
};
