# GitHub Branch Enforcer

## Description

We all love controls, and this project automates the protection of the master branch on new repositories for an Organization.

## Prerequistes

1. GitHub Organization
1. GitHub Personal Access Token with access to your Organization and the following scopes
   - admin:org_hook
   - repo
1. Heroku account and CLI [installed](https://devcenter.heroku.com/articles/heroku-cli)

## Getting Started

First, bootstrap Heroku with a valid configuration

```Bash
# Create new heroku application
heroku create

# Provide specific configuration for your GitHub Org and access token
heroku config:set GITHUB_ORG="<organiztion-name>"
heroku config:set GITHUB_TOKEN="<personal-access-token>"

# Dynamically update webhook URL
heroku config:set GITHUB_WEBHOOK_URL="$(heroku apps:info -s  | grep web_url | cut -d= -f2)api/enforcer/v1/webhook"

# Dynamically generate signing secret
heroku config:set GITHUB_WEBHOOK_SECRET="$(openssl rand -hex 8)"
```

Next, deploy your enforcer

```Bash
git push heroku master
```

As the application starts, it will install or update a webhook in your Organization configured to send events to your Heroku endpoints.

## What Now?

With your enforcer deployed, each time a new repository is created GitHub sends a webhook to this service. Using the metadata from the hook, we lock down the master branch.
