module.exports = function(grunt) {
    var semver = require('semver'),
        currentVersion = require('../package.json').version;
    return {
        deploy: {
            options: {
                questions: [
                    {
                        config: 'bump.version-type',
                        type: 'list',
                        message: 'Bump version from ' + '<%= package.version %>'.cyan + ' to:',
                        choices: [
                            {
                                value: 'patch',
                                name: 'Patch:  '.yellow + semver.inc(currentVersion, 'patch').yellow +
                                    '   Backwards-compatible bug fixes.'
                            },
                            {
                                value: 'minor',
                                name: 'Minor:  '.yellow + semver.inc(currentVersion, 'minor').yellow +
                                    '   Adding new features but still backwards-compatible.'
                            },
                            {
                                value: 'major',
                                name: 'Major:  '.yellow + semver.inc(currentVersion, 'major').yellow +
                                    '   Incompatible API changes.'
                            },
                            {
                                value: 'custom',
                                name: 'Custom: ?.?.?'.yellow +
                                    '   Specify version...'
                            }
                        ]
                    },
                    {
                        config: 'bump.custom-version',
                        type: 'input',
                        message: 'What specific version would you like',
                        when: function(answers) {
                            return answers['bump.version-type'] === 'custom';
                        },
                        validate: function(value) {
                            var valid = semver.valid(value) && true;
                            return valid || 'Must be a valid semver, such as 1.2.3';
                        }
                    },
                    {
                        config: 'bump.options.commit',
                        type: 'confirm',
                        message: 'Do you want to commit the ./dist, bower.json, and package.json files?'
                    },
                    {
                        config: 'bump.options.createTag',
                        type: 'confirm',
                        message: 'Do you want to tag this release?',
                        when: function(answers) {
                            return answers['bump.options.commit']
                        }
                    },
                    {
                        config: 'bump.options.push',
                        type: 'confirm',
                        message: 'Do you want to push the new release?',
                        when: function(answers) {
                            return answers['bump.options.commit'] && answers['bump.options.createTag']
                        }
                    },
                    {
                        config: 'bump.options.pushTo',
                        type: 'input',
                        message: 'Where would you like to push to?',
                        default: 'origin master:master',
                        when: function(answers) {
                            return answers['bump.options.push']
                        }
                    }
                ],
                then: function(results) {
                    var versionType = results['bump.version-type'],
                        bumpTask = 'bump';

                    if ('custom' === versionType) {
                        grunt.option('setversion', results['bump.custom-version']);
                    } else {
                        bumpTask += ':' + versionType;
                    }

                    grunt.task.run(['deploy', bumpTask]);
                }
            }
        }
    };
};
