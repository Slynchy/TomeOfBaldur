/* eslint-disable */

// const SHBuildCollectiblesMapPlugin = require("./build/plugins/SHBuildCollectiblesMapPlugin")
const CopyPlugin = require("copy-webpack-plugin");
const SharedConfig = require("./build/SharedWebpackSettings.js");
const {DefinePlugin} = require("webpack");
const ESLintPlugin = require("eslint-webpack-plugin");
const CheckImageWidthHeightPlugin = require("./build/plugins/CheckImageWidthHeightPlugin");

module.exports = {
    entry: SharedConfig.ENTRYPOINTS,
    mode: "production",
    devtool: "source-map",
    target: SharedConfig.TARGET,
    devServer: SharedConfig.DEVSERVER_SETTINGS,
    plugins: [
        new CopyPlugin(SharedConfig.COPY_PLUGIN_SETTINGS),
        new CheckImageWidthHeightPlugin(
            SharedConfig.CheckImageWidthHeightPlugin_SETTINGS
        ),
        // new SHBuildCollectiblesMapPlugin(
        //     SharedConfig.SHBuildCollectiblesMapPlugin_SETTINGS
        // ),
        // new HtmlWebpackPlugin(SharedConfig.HTML_TEMPLATE_SETTINGS),
        new DefinePlugin({
            __PRODUCTION: true,
            __VERSION: SharedConfig.VERSION
        }),
        new ESLintPlugin(SharedConfig.ESLINT_SETTINGS)
    ],
    module: { rules: SharedConfig.MODULE_RULES },
    optimization: SharedConfig.MINIMIZE_SETTINGS,
    resolve: SharedConfig.RESOLVE_SETTINGS,
    output: SharedConfig.OUTPUT_SETTINGS,
};
