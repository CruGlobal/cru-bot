var builder = require('botbuilder');

const defaultSettings = {
    pageSize: 5
};

// Create the BotBuilder library for Search with the specified Id
function create(libraryId, settings) {
    if (typeof (libraryId) !== 'string' || libraryId.length === 0) {
        throw new Error('libraryId is required');
    }

    settings = Object.assign({}, defaultSettings, settings);
    if (typeof (settings.search) !== 'function') {
        throw new Error('options.search is required');
    }

    const library = new builder.Library(libraryId);

    // Entry point. Closure that handlers these states
    // - A. Entering search text. Will trigger search
    // - B. No input. Will trigger search prompt
    library.dialog('/',
        new builder.SimpleDialog((session, args) => {
            args = args || {};

            var query = args.query || session.dialogData.query || emptyQuery();
            session.dialogData.query = query;

            var input = args.response;
            var hasInput = typeof (input) === 'string';
            if (hasInput) {
                // Process input
                // A. Perform search
                var newQuery = Object.assign({}, query, { searchText: input });
                performSearch(session, newQuery);
            } else {
                // B. Prompt
                searchPrompt(session);
            }
        }));

    // Handle display results
    library.dialog('/results',
        new builder.IntentDialog()
            .onBegin((session, args) => {
                // Save previous state
                session.dialogData.searchResponse = args.searchResponse;
                session.dialogData.query = args.query;

                if (args.searchResponse === false) {
                    // No Results
                    session.send('Sorry, I didn\'t find any matches. Please enter another search.');
                } else {
                    // Display results
                    var results = args.searchResponse.results
                    var reply = new builder.Message(session)
                        .text('Here\'s what I\'ve found for you:')
                        .attachmentLayout(builder.AttachmentLayout.carousel)
                        .attachments(results.map(searchHitAsCard.bind(null, true)));

                    session.send(reply);

                    session.send('Say *more* if you\'d like to see more results or enter another search.');
                }
            })
            .matches(/more|next/i, (session) => {
                // Next Page
                session.dialogData.query.pageNumber++;
                performSearch(session, session.dialogData.query);
            })
            .onDefault((session, args) => {
                // Start New Search
                var newQuery = Object.assign({}, emptyQuery(), { searchText: session.message.text });
                performSearch(session, newQuery);
            }));

    function performSearch(session, query) {
        settings.search(query).then((response) => {
            session.beginDialog('/results', {
                searchResponse: response.results.length === 0 ? false : response,
                query: query
            });
        });
    }

    function searchHitAsCard(showSave, searchHit) {
        var buttons = showSave
            ? [new builder.CardAction().type('openUrl').title('Visit').value(searchHit.result.link)]
            : [];

        var card = new builder.ThumbnailCard()
            .title(searchHit.title)
            .buttons(buttons);

        if (searchHit.result.formattedUrl) {
            card.subtitle(searchHit.result.formattedUrl);
        }

        if (searchHit.description) {
            card.text(searchHit.description);
        }

        if (searchHit.imageUrl) {
            card.images([new builder.CardImage().url(searchHit.imageUrl)])
        }

        return card;
    }

    function searchPrompt(session) {
        var prompt = 'Welcome to Cru! What can I help you find?';
        if (!!session.dialogData.firstTimeDone) {
            prompt = 'Anything else I can help you find?';
        }

        session.dialogData.firstTimeDone = true;
        builder.Prompts.text(session, prompt);
    }

    function emptyQuery() {
        return { pageNumber: 1, pageSize: settings.pageSize };
    }

    return library;
}

// This helper transforms each of the AzureSearch result items using the mapping function provided (itemMap) 
function defaultResultsMapper(itemMap) {
    return function (providerResults) {
        return {
            results: providerResults.results.map(itemMap),
            facets: providerResults.facets
        };
    };
}

// Exports
module.exports = {
    create: create,
    defaultResultsMapper: defaultResultsMapper
};