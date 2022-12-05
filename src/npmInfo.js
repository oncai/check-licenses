const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

module.exports.npmInfo = async (packageName) => {
  const { stdout } = await exec(`npm info ${packageName} --json`);
  return JSON.parse(stdout);
};
