module.exports = {
    // Run Unit Tests Once
    "once": {
        "options": {
            "port": 9018,
            "runnerPort": 9100,
            "singleRun": true,
            "background": false
        }
    },
    // Used during watch. It just sets up the server and then watch calls 'karma:watch:run' to fire off tests.
    "watch": {
        "options": {
            "port": 9118,
            "runnerPort": 9200,
            "singleRun": false,
            "background": true
        }
    },
    "options": {
        "files": [
            "test/*.js"
        ],
        "frameworks": [
            "jasmine",
            "browserify"
        ],
        "plugins": [
            "karma-jasmine",
            "karma-phantomjs-launcher",
            "karma-browserify"
        ],
        "browserify": {
            "watch": true
        },
        preprocessors: {
            "test/*.js": ["browserify"]
        },
        "reporters": "dots",
        "urlRoot": "/",
        "autoWatch": false,
        "logLevel": "ERROR",
        "browsers": [
            "PhantomJS"
        ]
    }
};
