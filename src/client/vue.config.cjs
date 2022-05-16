const { defineConfig } = require("@vue/cli-service")
module.exports = defineConfig({
    configureWebpack: {
        devtool: 'source-map',
    },
    transpileDependencies: true,
    devServer: {
        https: true,
        host: "0.0.0.0"
    }
})
