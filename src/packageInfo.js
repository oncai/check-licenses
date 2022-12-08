const axios = require('axios');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

module.exports.npmInfo = async (packageName) => {
  const { stdout } = await exec(`npm info ${packageName} --json`);
  return JSON.parse(stdout);
};

module.exports.pythonInfo = async (packageName) => {
  const response = await axios.get(`https://pypi.org/pypi/${packageName}/json`);
  const package = {
    name: packageName,
    license: response.data.info.license,
    homepage:
      response.data.info.home_page || response.data.info.project_urls.homepage,
  };
  return package;
};
