#!/usr/bin/env babel-node

require('./helper');
const fs = require('fs');

module.exports = async function readS(filePath) {
  const data = await fs.createReadStream(filePath);
 // console.log(data);
  return data
}

// readS()

