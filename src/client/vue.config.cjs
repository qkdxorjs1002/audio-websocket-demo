const { defineConfig } = require("@vue/cli-service")
const fs = require("fs")

module.exports = defineConfig({
    configureWebpack: {
        devtool: 'source-map',
    },
    transpileDependencies: true,
    devServer: {
        https: {
            key: fs.readFileSync("../cert/pr.pem"),
            cert: fs.readFileSync("../cert/cert.pem")
        }
    }
})
