module.exports = function generateIssue(owner) {
  return {
    title: "master branch protected",
    body: `@${owner} master branch protections enabled`,
    labels: ["enforcer"]
  };
};
