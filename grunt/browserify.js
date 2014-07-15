module.exports = {
    "options": {
        "bundleOptions": {
            "standalone": '<%= package.name %>'
        }
    },
    "deploy": {
        "src": 'src/main.js',
        "dest": 'dist/band.js'
    }
};
