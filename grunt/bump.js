module.exports = {
    options: {
        files: ['bower.json', 'package.json'],
        commit: false,
        commitMessage: 'Releasing: %VERSION%',
        commitFiles: ['dist/', 'bower.json', 'package.json'],
        createTag: false,
        tagName: '%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: false,
        pushTo: 'origin master:master'
    }
};
