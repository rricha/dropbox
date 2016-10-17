#!/usr/bin/env babel-node

require('./helper');
const fs = require('fs').promise;

module.exports = async function mkdir(filePath) {
  return await fs.mkdir(filePath);
};
