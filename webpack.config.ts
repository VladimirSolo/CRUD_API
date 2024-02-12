import path from "path";
import NodemonPlugin from "nodemon-webpack-plugin";
import { DefinePlugin } from "webpack";
import dotenv from "dotenv";

module.exports = {
  entry: path.resolve(__dirname, "./src/index.ts"),
  mode: process.env.MODE || 'development',
  target: "node",
  module: {
    rules: [
      {
        test: /\.ts$/i,
        use: "ts-loader",
        include: [path.resolve(__dirname, "src")],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new NodemonPlugin({ script: "dist/bundle.js" }),
    new DefinePlugin({
      "process.env": JSON.stringify(dotenv.config().parsed),
    }),
  ],
};
