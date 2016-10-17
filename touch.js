#!/usr/bin/env babel-node

require('./helper');
const fs = require('fs').promise;

module.exports = async function touch(filePath) {
  return await fs.open(filePath, 'wx');
}

