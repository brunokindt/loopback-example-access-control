/* jshint camelcase: false */
var app = require('../server/server');
var request = require('supertest-as-promised');
var assert = require('assert');
var loopback = require('loopback');

function json(verb, url) {
    return request(app)[verb](url)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/);
  }

function login(credentials) {
    return json('post', '/api/users/login')
    .send(credentials)
    .expect(200)
      //.expect(200, function(err, res) {
      //  assert(typeof res.body === 'object');
      //  assert(res.body.id, 'must have an access token');
      //  assert.equal(res.body.userId, 3);
      //  accessToken = res.body.id;
    .then( res => res.body.id );
}

describe('REST API request', function() {

  before(function(done) {
    require('./start-server');
    done();
  });

  after(function(done) {
    app.removeAllListeners('started');
    app.removeAllListeners('loaded');
    done();
  });

  describe('Teams', () => {

    it('should not allow access without access token', () =>
      json('get', '/api/teams').expect(404)
    );

    it('should not allow access with access token', () =>
      login({ username: 'user 1', password: 'password' })
      .then( accessToken =>
        json('get', '/api/teams/?access_token=' + accessToken)
        .expect(404)
      )
    );

  });


  describe('Shops', () => {

    it('should not allow access without access token', () =>
      json('get', '/api/shops').expect(401)
    );

    // NEXT
    //it('should display a list of team members', () =>
    //  login({ username: 'user 1', password: 'password' })
    //  .then( accessToken =>
    //    json('get', '/api/shops/1/teams?access_token=' + accessToken)
    //    .expect(200)
    //    .then( res => {
    //      assert(Array.isArray(res.body));
    //    })
    //  )
    //);

    //it('should not display team members of another store', () => {
    //  login({ username: 'user 1', password: 'password' })
    //  .then( accessToken =>
    //    json('get', '/api/shops/2/teams?access_token=' + accessToken)
    //    .expect(401)
    //  );
    //});

    //it('should show user info using currentUserLiteral', () =>
    //  login({ username: 'user 1', password: 'password' })
    //  .then( accessToken =>
    //    json('get', `/api/users/me?access_token=${accessToken}`)
    //    .expect(200, function(res){
    //      assert(typeof res.body === 'object');
    //      assert.equal(res.body.id, 3);
    //      assert.equal(res.body.username, 'user 1');
    //    })
    //  )
    //);

  });
});

describe('Unexpected Usage', () => {

  it('should not crash the server when posting a bad id', () =>
    json('post', '/api/users/foobar')
      .send({})
      .expect(404)
  );

});
