const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

module.exports.npmInfo = async (packageName) => {
  const { stdout } = await exec(`npm info ${packageName} --json`);
  return JSON.parse(stdout);
};

module.exports.pythonInfo = async (packageName) => {
  const { stdout } = await exec(
    `pip-licenses --format=json --with-urls  --packages ${packageName}`,
  );
  const info = JSON.parse(stdout);
  return info[0];
};
