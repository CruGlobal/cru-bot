var restify = require('restify');
var builder = require('botbuilder');
require('dotenv-extended').load();

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.RESTIFY_PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// ELB Healthcheck
server.get('/monitors/lb', (req, res, next) => {
    res.send('OK');
    return next();
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

// Start Searcher when conversation with bot is started, by initiating the root dialog
bot.on('conversationUpdate', (message) => {
    if (message.membersAdded) {
        message.membersAdded.forEach((identity) => {
            if (identity.id === message.address.bot.id) {
                bot.beginDialog(message.address, '/');
            }
        });
    }
});

// Web Chat calls this initially
bot.dialog('/', [(session) => {
    if (session.message && session.message.text) {
        session.beginDialog('googlesearch:/', { response: session.message.text });
    } else {
        session.beginDialog('googlesearch:/');
    }
}]);

//=========================================================
// Searcher
//=========================================================
var GoogleCustomSearch = require('./SearchProviders/google-custom-search');
var googleCustomSearchClient = GoogleCustomSearch.create(process.env.GOOGLE_CUSTOM_SEARCH_API_KEY, process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID);

var SearchDialogLibrary = require('./SearchDialogLibrary');
var googleSearchResultsMapper = SearchDialogLibrary.defaultResultsMapper(googlesearchToSearchHit);

var googlesearch = SearchDialogLibrary.create('googlesearch', {
    search: (query) => googleCustomSearchClient.search(query).then(googleSearchResultsMapper),
});

bot.library(googlesearch);

// Maps the GoogleSearch Result into a SearchHit that the Search Library can use
function googlesearchToSearchHit(googlesearch) {
    return {
        key: googlesearch.cacheId,
        title: googlesearch.title,
        description: googlesearch.snippet,
        result: googlesearch
    };
}