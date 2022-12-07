class PackageAddition {
  constructor(lineNumber, name, version, license, homepage) {
    this.lineNumber = lineNumber;
    this.name = name;
    this.version = version;
    this.license = license;
    this.homepage = homepage;
  }
}

module.exports = { PackageAddition };
