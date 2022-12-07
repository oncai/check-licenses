const { core } = require('./action');
const { NewPackageFinder } = require('./NewPackageFinder');

async function run() {
  const dependencyFile = core.getInput('dependency-file');
  const newPackageFinder = new NewPackageFinder(dependencyFile);
  const newPackages = await newPackageFinder.find();

  if (newPackages === null) {
    return;
  }

  console.log(`${newPackages.length} new packages found`);
  for (const package of newPackages) {
    console.log(package);
  }
}

run();
