var app = angular.module('app', ['ui.bootstrap']);
app.controller('AppController', function($scope) {

    $scope.tempo = 120;

    var songs = {
        c_major: {
            timeSignature: [4, 4],
            tempo: $scope.tempo,
            instruments: {
                rightHand: {
                    name: 'square',
                    pack: 'oscillators'
                }
            },
            notes: {
                // Shorthand notation
                rightHand: [
                    'quarter|C5',
                    'quarter|D5',
                    'quarter|E5',
                    'quarter|F5',
                    'quarter|G5',
                    'quarter|A5',
                    'quarter|B5',
                    'quarter|C6'
                ]
            }
        },
        g_major: {
            timeSignature: [4, 4],
            tempo: $scope.tempo,
            instruments: {
                rightHand: {
                    name: 'square',
                    pack: 'oscillators'
                },
                leftHand: {
                    name: 'sawtooth',
                    pack: 'oscillators'
                }
            },
            notes: {
                // Shorthand notation
                rightHand: [
                    'quarter|G4',
                    'quarter|A4',
                    'quarter|B4',
                    'quarter|C5',
                    'quarter|D5',
                    'quarter|E5',
                    'quarter|F#5',
                    'quarter|G5'
                ],
                // More verbose notation
                leftHand: [
                    {
                        type: 'note',
                        pitch: 'G3',
                        rhythm: 'quarter'
                    },
                    {
                        type: 'note',
                        pitch: 'A3',
                        rhythm: 'quarter'
                    },
                    {
                        type: 'note',
                        pitch: 'B3',
                        rhythm: 'quarter'
                    },
                    {
                        type: 'note',
                        pitch: 'C4',
                        rhythm: 'quarter'
                    },
                    {
                        type: 'note',
                        pitch: 'D4',
                        rhythm: 'quarter'
                    },
                    {
                        type: 'note',
                        pitch: 'E4',
                        rhythm: 'quarter'
                    },
                    {
                        type: 'note',
                        pitch: 'F#4',
                        rhythm: 'quarter'
                    },
                    {
                        type: 'note',
                        pitch: 'G4',
                        rhythm: 'quarter'
                    }
                ]
            }
        }
    };

    var conductor = new BandJS(),
        player;

    $scope.songLoaded = false;
    $scope.playing = $scope.paused = $scope.muted = false;
    $scope.volume = 50;
    $scope.currentSeconds = 0;
    $scope.timeSlider = 0;

    $scope.loadSong = function(songName) {
        $scope.songLoaded = true;
        if ($scope.playing) {
            return;
        }
        player = conductor.load(songs[songName]);
        $scope.totalSeconds = conductor.getTotalSeconds();
        $scope.tempo = songs[songName].tempo;
    };

    var pauseTicker = false;

    conductor.setTickerCallback(function(seconds) {
        $scope.$apply(function() {
            if (! pauseTicker) {
                $scope.currentSeconds = seconds;
            }
        });
    });

    conductor.setOnFinishedCallback(function() {
        $scope.$apply(function() {
            $scope.playing = $scope.paused = false;
        });
    });

    conductor.setOnDurationChangeCallback(function() {
        $scope.totalSeconds = conductor.getTotalSeconds();
    });

    $scope.play = function() {
        $scope.playing = true;
        $scope.paused = false;
        player.play();
    };

    $scope.stop = function() {
        $scope.playing = $scope.paused = false;
        player.stop();
    };

    $scope.pause = function() {
        $scope.paused = true;
        player.pause();
    };

    $scope.updateTime = function() {
        pauseTicker = false;
        player.setTime($scope.currentSeconds);
    };

    $scope.updateTempo = function() {
        pauseTicker = false;
        conductor.setTempo($scope.tempo);
    };

    $scope.movingTime = function() {
        pauseTicker = true;
    };

    $scope.$watch('loop', function() {
        if (player) {
            player.loop($scope.loop);
        }
    });

    $scope.$watch('mute', function(newVal, oldVal) {
        if (newVal === oldVal || ! player) {
            return;
        }

        if ($scope.mute) {
            player.mute();
        } else {
            player.unmute();
        }
        $scope.muted = $scope.mute;
    });

    $scope.$watch('volume', function() {
        conductor.setMasterVolume($scope.volume / 100);
    });
});

app.filter('musicTime', function() {
    function pad ( num, size ) {
        return ( Math.pow( 10, size ) + ~~num ).toString().substring( 1 );
    }

    return function(seconds, showRemaining) {
        var duration = moment.duration(parseInt(seconds), 'seconds'),
            secs = duration.seconds(),
            mins = duration.minutes(),
            hrs = duration.hours();

        if (hrs > 0) {
            mins += (hrs * 60);
        }

        return mins + ':' + pad(secs, 2);
    }
});
