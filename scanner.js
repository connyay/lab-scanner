'use strict';

var request = require('request');
var Q = require('q');
var _ = require('lodash');
var config = require('./config');

var token;

function authenticate() {
    var deferred = Q.defer();
    var options = {
        url: 'https://' + config.host + '/broker/rest/user/authorizations?scope=session&reuse=true',
        method: 'POST',
        strictSSL: false,
        headers: {
            'Accept': '*/*',
            'Authorization': 'Basic ' + config.basicAuth
        }
    };
    request(options, function(error, response, body) {
        if (error) throw error;

        if (response.statusCode === 200 || response.statusCode === 201) {
            token = JSON.parse(body).data.token;
        }
        deferred.resolve(token);
    });
    return deferred.promise;
}

function getApps(token) {
    if (!token) {
        console.log('No token... Not sure what to do');
    }
    request({
        url: 'https://' + config.host + '/broker/rest/applications',
        strictSSL: false,
        headers: {
            'Accept': '*/*',
            'Authorization': 'Bearer ' + token
        }
    }, function(error, response, body) {
        if (error) throw error;

        if (response.statusCode === 200 || response.statusCode === 201) {
            var apps = JSON.parse(body).data;
            apps = _.chain(apps)
                .filter(function(app) {
                    return app.domain_id === 'labsdev' || app.domain_id === 'labsprod';
                })
                .map(function(app) {
                    return {
                        name: app.name,
                        git: app.git_url,
                        ssh: app.ssh_url,
                        domain: app.domain_id,
                        created: app.creation_time,
                        url: app.app_url
                    };
                })
                .valueOf();
            // should post apps somewhere here... for now just dump and quit
            console.log(apps);
            process.exit(0);
        }
    });
}

authenticate().then(getApps);
