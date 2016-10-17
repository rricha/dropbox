#!/usr/bin/env babel-node

require('./helper');
const fs = require('fs').promise;

module.exports = async function cat(filePath) {
  return await fs.readFile(filePath);
}
