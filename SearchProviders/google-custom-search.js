var google = require('googleapis');
var customsearch = google.customsearch('v1');
var Promise = require('bluebird');

function create(apiKey, searchEngineId) {
    var key = apiKey,
        engineId = searchEngineId;

    return {
        search: function (query) {
            return new Promise((resolve, reject) => {
                var params = {
                    auth: key,
                    cx: engineId,
                    q: query.searchText,
                    num: query.pageSize,
                    start: 1 + ((query.pageNumber - 1) * query.pageSize)
                };

                customsearch.cse.list(params, (err, results) => {
                    if (err) {
                        return reject(err);
                    }

                    resolve({
                        results: results.items || []
                    });
                });
            });
        }
    }
}

// Exports
module.exports = {
    create: create
};