module.exports = {
    "options": {
        "compress": true,
        "banner": '/*! <%= package.name %> - v<%= package.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n'
    },
    "deploy": {
        "src": 'dist/band.js',
        "dest": 'dist/band.min.js'
    }
};
