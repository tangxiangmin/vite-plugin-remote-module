let path = require('path')

export default {
    input: './src/index.js',
    output: [
        {
            file: path.resolve(__dirname, './lib/index.js'),
            format: 'cjs'
        }, {
            file: path.resolve(__dirname, './esm/index.js'),
            format: 'es'
        }
    ],
    external: ['vue']
}