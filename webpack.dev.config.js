
// const SHBuildCollectiblesMapPlugin = require("./build/plugins/SHBuildCollectiblesMapPlugin")
const CopyPlugin = require("copy-webpack-plugin");
const SharedConfig = require("./build/SharedWebpackSettings.js");
const {DefinePlugin} = require("webpack");
const ESLintPlugin = require("eslint-webpack-plugin");
const CheckImageWidthHeightPlugin = require("./build/plugins/CheckImageWidthHeightPlugin");
const {SHBuildCollectiblesMapPlugin_SETTINGS} = require("./build/SharedWebpackSettings");

module.exports = {
    entry: SharedConfig.ENTRYPOINTS,
    mode: "development",
    devtool: "source-map",
    target: SharedConfig.TARGET,
    devServer: SharedConfig.DEVSERVER_SETTINGS,
    plugins: [
        new CopyPlugin(SharedConfig.COPY_PLUGIN_SETTINGS),
        new CheckImageWidthHeightPlugin(
            Object.assign(
                SharedConfig.CheckImageWidthHeightPlugin_SETTINGS,
                {
                    throw: false,
                },
            )
        ),
        // new HtmlWebpackPlugin({
        //     hash: false,
        //     ...SharedConfig.HTML_TEMPLATE_SETTINGS
        // }),
        // new SHBuildCollectiblesMapPlugin(SHBuildCollectiblesMapPlugin_SETTINGS),
        new DefinePlugin({
            __PRODUCTION: false,
            __VERSION: SharedConfig.VERSION
        }),
        new ESLintPlugin(SharedConfig.ESLINT_SETTINGS)
    ],
    module: { rules: SharedConfig.MODULE_RULES },
    resolve: SharedConfig.RESOLVE_SETTINGS,
    output: SharedConfig.OUTPUT_SETTINGS,
};
