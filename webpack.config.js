const path = require('path');
const { createWriteStream, mkdirSync, existsSync } = require('fs');
const glob = require('glob');
const archiver = require('archiver');

const filePathRegex = /^[^/]+\/([^/]+)\/([^/]+)?\/?index.js$/;

const artifactsPath = './artifacts';

if (!existsSync(artifactsPath)) {
  mkdirSync(artifactsPath);
}

function getEntryFiles() {
  const entries = {};
  try {
    const files = glob.sync('!(node_modules)/**/index.js');
    files.forEach((file) => {
      const matches = filePathRegex.exec(file);
      const key = `${matches[1]}${matches[2] ? matches[2].charAt(0).toUpperCase() + matches[2].slice(1) : ''}`;
      entries[key] = `./${file}`;
    });
    return entries;
  } catch (e) {
    return entries;
  }
}

/**
 * @param {string} name
 * @param {string} value
 * */
function zip(name, value) {
  const archive = archiver('zip', {});
  const output = createWriteStream(`${artifactsPath}/${name}.zip`);
  archive.pipe(output);
  archive.append(value, { name: 'index.js' });

  return new Promise((resolve, reject) => {
    output.on('end', () => {
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.finalize();
  });
}

class PackageLambdasPlugin {
  apply(compiler) { // eslint-disable-line
    compiler.hooks.emit.tapAsync('PackageLambdasPlugin', (compilation, callback) => {
      const promises = [];
      Object.keys(compilation.assets).forEach((key) => {
        const asset = compilation.assets[key];
        const name = key.split('/')[0];
        promises.push(zip(name, asset.source()));
      });
      Promise.all(promises).then(() => callback());
    });
  }
}

/**
 * @type {import("webpack").Configuration}
 */
const config = {
  entry: getEntryFiles(),
  mode: 'production',
  externals: { 'aws-sdk': 'aws-sdk' },
  target: 'node',
  plugins: [new PackageLambdasPlugin()],
  output: {
    filename: '[name]/index.js',
    path: path.join(__dirname, 'build'),
    libraryTarget: 'commonjs',
  },
};

module.exports = config;
