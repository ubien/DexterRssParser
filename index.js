var request = require('request');
var FeedParser = require('feedparser');
var _ = require ('lodash');
module.exports = {
    run: function(step) {
        var url = step.input('url').first(),
          filter = step.input('filter').first(),
          self = this;
        this.fetchUrl(url, function(err, stream) {
            if(err) {
                return self.fail(err);
            }
            //Let the parser grab the data
            self.fetchItems(stream, function(err, items) {
                var response = [];
                if(err) {
                    return self.fail(err);
                }
                //Extract dexter-friendly data from the items
                _.each(items, function(item) {
                    response.push(
                      {url: item.link}
                      //{
                      //  url: item.link,
                      //  title: item.title,
                      //  summary: item.summary,
                      //  author: item.author
                      //}
                    );
                });
                return self.complete(response);
            });
        });
    },
    fetchUrl: function(url, callback) {
        var req = request(url);
        req.on('error', callback);
        req.on('response', function(resp) {
            if(resp.statusCode != 200) {
                return callback(new Error(
                  'Bad status code ' + resp.statusCode + ' for ' + url
                ));
            }
            return callback(null, this);
        });
    },
    fetchItems: function(stream, callback) {
        var parser = new FeedParser()
          , items = [];
        parser.on('error', callback);
        parser.on('end', function(err) {
            if(err) {
                return callback(err);
            }
            return callback(null, items);
        });
        parser.on('readable', function() {
            var item;
            while((item = this.read())) {
                items.push(item);
            }
        });
        stream.pipe(parser);
    },

    filterItems: function(items, term) {
        var response = []
          , lcTerm = term.toLowerCase();
        _.each(items, function(item) {
            _.forIn(item, function(val) {
                if(val.toLowerCase().indexOf(lcTerm) >= 0) {
                    response.push(item);
                    return false;
                }
            });
        });
        return response;
    }
}