module.exports = function generateIssue(owner) {
  return {
    title: "master branch protected",
    body: `@${owner} master branch protections enabled.  Pull requests now require at least one (1) reviewer's approval before it can be merged.  This branch also cannot be force-pushed to or deleted.`,
    labels: ["enforcer"]
  };
};
