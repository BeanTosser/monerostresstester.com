const path = require("path");
var webpack = require('webpack');

let configBase = {
    module: {
      rules: [
//        {
//          test: /\.wasm$/,
//          loader: "file-loader",
//          exclude: path.join(__dirname, 'node_modules')
//        },
        {
          test: /\.(js|jsx)$/,
          exclude: path.join(__dirname, 'node_modules'),
          type: "javascript/auto",
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: false
                // ,
                // presets: [ "es2015" ],
                // plugins: ["transform-runtime"]
              }
            }
          ]
        },
        {
          // Preprocess your css files
          // you can add additional loaders here (e.g. sass/less etc.)
          test: /\.css$/,
          exclude: /node_modules/,
          use: ['style-loader', 'css-loader'],
        },
      ]
    },
    devtool: 'source-map',
    externals: ['worker_threads','ws','perf_hooks'], // exclude nodejs
    resolve: {
      symlinks: false,
      alias: {
        "fs": "html5-fs"
      },
      extensions: ['*', '.js', '.jsx', '.css', '.json', 'otf', 'ttf', 'eot', 'svg'],
      modules: [
        'node_modules'
      ]
    },
    cache: true,
    context: __dirname
};

let configStressTester = Object.assign({}, configBase, {
  name: "Stress Tester",
  entry: "./src/main/index.js",
  output: {
    path: path.resolve(__dirname, "browser_build"),
    filename: "stress_tester.dist.js"
  }
});

module.exports = [
  configStressTester
];
