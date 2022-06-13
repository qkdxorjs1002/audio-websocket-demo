const { defineConfig } = require("@vue/cli-service")
const fs = require("fs")

module.exports = defineConfig({
    configureWebpack: {
        devtool: 'source-map',
    },
    transpileDependencies: true,
    devServer: {
        https: {
            ca: fs.readFileSync("../cert/rootca.crt"),
            key: fs.readFileSync("../cert/ssl.key"),
            cert: fs.readFileSync("../cert/ssl.crt"),
            rejectUnauthorized: false
        }
    }
})
