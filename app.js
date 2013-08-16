var
  util = require('util'),
  banking = require('banking'),
  moment = require('moment'),
  express = require('express'),
  googleapis = require('googleapis'),
  settings = {
    server: {
      hostname: 'mktgdept.com',
      port: '5555'
    },
    google: {
      client_id: '000000000000.apps.googleusercontent.com',
      client_secret: 'bbbbbbbbbbbbbbbbbbbbbbbb'
    },
    americanexpress: {
      username: 'username',
      password: 'password',
      card_number: '333333333333333'
    }
  },
  numberFormat = function(num) {
    var parts = num.toString().split('.');
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (parts[1] ? '.' + parts[1] : '');
  },
  template = function(balance) {
    return '<article><section><table class="text-auto-size"><tbody><tr><td>Balance</td><td class="align-right">$' + balance + '</td></tr></tbody></table></section><footer><p class="yellow">American Express</p></footer></article>';
  },
  OAuth2Client = googleapis.OAuth2Client,
  oauth2Client,
  app = express(),
  getBalance = function(callback) {
    banking.getStatement({
	    fid: '3101',
	    fidorg: 'AMEX',
	    url: 'https://online.americanexpress.com/myca/ofxdl/desktop/desktopDownload.do?request_type=nl_ofxdownload',
	    bankid: 'americanexpress.com',
	    user: settings.americanexpress.username,
	    pass: settings.americanexpress.password,
	    accid: settings.americanexpress.card_number,
	    acctype: 'CREDITCARD',
	    date_start: moment().format('YYYYMMDD'),
	    date_end: moment().format('YYYYMMDD'),
	    appver: '1900'
    }, function(res, err) {
      callback(numberFormat(-1 * res.OFX.CREDITCARDMSGSRSV1.CCSTMTTRNRS.CCSTMTRS.LEDGERBAL.BALAMT));
    });
  };

app.configure(function() {
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
});

app.get('/', function(req, res) {
  if(!oauth2Client || !oauth2Client.credentials) {
    oauth2Client = new OAuth2Client(settings.google.client_id, settings.google.client_secret, 'http://' + settings.server.hostname + ':' + settings.server.port + '/oauth2callback');
    res.redirect(oauth2Client.generateAuthUrl({
      access_type: 'offline',
      approval_prompt: 'force',
      scope: [
        'https://www.googleapis.com/auth/glass.timeline',
        'https://www.googleapis.com/auth/userinfo.profile'
      ].join(' ')
    }));
  }
  else {
    googleapis.discover('mirror', 'v1').execute(function(err, client) {
      client.mirror.subscriptions.insert({
        callbackUrl: 'https://mirrornotifications.appspot.com/forward?url=http://' + settings.server.hostname + ':' + settings.server.port + '/subcallback',
        collection: 'timeline'
      }).withAuthClient(oauth2Client).execute(function(err, result) {
        console.log('mirror.subscriptions.insert', util.inspect(result));
      });
      getBalance(function(balance) {
        client.mirror.timeline.insert({
          html: template(balance),
          menuItems: [
            {
              id: 'refresh',
              action: 'CUSTOM',
              values: [
                {
                  displayName: 'Refresh',
                  iconUrl: 'http://' + settings.server.hostname + ':' + settings.server.port + '/refresh.png'
                }
              ]
            },
            {
              action: 'TOGGLE_PINNED'
            },
            {
              action: 'DELETE'
            }
          ]
        }).withAuthClient(oauth2Client).execute(function(err, result) {
          console.log('mirror.timeline.insert', util.inspect(result));
        });
      });
    });
    res.send(200);
  }
});

app.get('/oauth2callback', function(req, res) {
  if(!oauth2Client) {
    res.redirect('/');
  }
  else {
    oauth2Client.getToken(req.query.code, function(err, tokens) {
      oauth2Client.credentials = tokens;
      res.redirect('/');
    });
  }
});

app.post('/subcallback', function(req, res) {
  res.send(200);
  console.log('/subcallback', util.inspect(req.body));
  if(req.body.operation == 'UPDATE' && req.body.userActions[0].type == 'CUSTOM')
    googleapis.discover('mirror', 'v1').execute(function(err, client) {
      getBalance(function(balance) {
        client.mirror.timeline.patch({
          id: req.body.itemId
        }, {
          html: template(balance)
        }).withAuthClient(oauth2Client).execute(function(err, result) {
          console.log('mirror.timeline.patch', util.inspect(result));
        });
      });
    });
});

app.listen(settings.server.port);
