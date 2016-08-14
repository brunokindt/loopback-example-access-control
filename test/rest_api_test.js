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

  describe.only('Teams', () => {

    it('should not allow access without access token', () =>
      json('get', '/api/teams').expect(401)
    );

    it('should allow access with access token', () =>
      json('post', '/api/users/login')
      .send({
        username: 'user 1',
        password: 'password'
      })
      .expect(200)
      .then( res => {
        assert(typeof res.body === 'object');
        assert(res.body.id, 'must have an access token');
        assert.equal(res.body.userId, 2);
        return res.body.id;
      })
      .then( accessToken =>
        json('get', '/api/teams/?access_token=' + accessToken).expect(200)
      )
      .catch(err => err )
    );

    it('should display a list of members', () =>
      json('post', '/api/users/login')
      .send({
        username: 'user 1',
        password: 'password'
      })
      .expect(200)
      .then( res => res.body.id )
      .then( accessToken =>
        json('get', '/api/teams/?access_token=' + accessToken)
        .expect(200)
        .then( res =>
          assert(Array.isArray(res.body))
        )
      )
      .catch( err => err )
    );

  });


  describe('Shops', () => {

    it('should not allow access without access token', () =>
      json('get', '/api/shops').expect(401)
    );

    // @TODO refactor to supertest-as-promised

    it('should login non-admin and get the team members', function(done) {
      json('post', '/api/users/login')
        .send({
          username: 'user 1',
          password: 'password'
        })
        .expect(200, function(err, res) {
          if (err) { done(err); }
          assert(typeof res.body === 'object');
          assert(res.body.id, 'must have an access token');
          assert.equal(res.body.userId, 2);
          var accessToken = res.body.id;
          json('get', '/api/projects/' + 1 + '?access_token=' + accessToken)
            .expect(200, function(err, res){
              var projects = res.body;
              assert(typeof res.body === 'object');
              assert(res.body.balance);
              assert.equal(res.body.balance, 100);
              done();
            });
        });
    });

    var accessToken;
    it('should login the admin user and get all projects', function(done) {
      json('post', '/api/users/login')
        .send({
          username: 'Bob',
          password: 'opensesame'
        })
        .expect(200, function(err, res) {
          assert(typeof res.body === 'object');
          assert(res.body.id, 'must have an access token');
          assert.equal(res.body.userId, 3);
          accessToken = res.body.id;
          json('get', '/api/projects?access_token=' + accessToken)
            .expect(200, function(err, res){
              var projects = res.body;
              assert(Array.isArray(res.body));
              assert.equal(res.body.length, 3);
            });
            done();
        });
    });

    it('should donate money to project1', function(done) {
          json('post', '/api/projects/donate?access_token=' + accessToken)
            .send({
              id: 2,
              amount: 10
            })
            .expect(200, function(err, res){
              assert(typeof res.body === 'object');
              assert(res.body.success);
              assert.equal(res.body.success, false);
            });
            done();
    });

    it('should login the admin user and get all project', function(done) {
      json('post', '/api/users/login')
        .send({
          username: 'Bob',
          password: 'opensesame'
        })
        .expect(200, function(err, res) {
          assert(typeof res.body === 'object');
          assert(res.body.id, 'must have an access token');
          assert.equal(res.body.userId, 3);
          accessToken = res.body.id;
          json('get', '/api/projects/count?access_token=' + accessToken)
            .expect(200, function(err, res){
              assert(typeof res.body === 'object');
              assert(res.body.count);
              // total number of projects is 3
              assert.equal(res.body.count, 3);
              done();
            });
        });
    });

    it('should not allow access to project count without admin role', function(done){
      json('post', '/api/users/login')
        .send({
          username: 'John',
          password: 'opensesame'
        })
        .expect(200, function(err, res){
          assert(typeof res.body === 'object');
          assert(res.body.id, 'must have an access token');
          accessToken = res.body.id;
          json('get', '/api/projects/count?access_token=' + accessToken)
          .expect(401, done);
        });
    });

    it('should show teams for a user', function(done) {
      json('post', '/api/users/login')
        .send({
          username: 'Jane',
          password: 'opensesame'
        })
        .expect(200, function(err, res) {
          assert(typeof res.body === 'object');
          assert(res.body.id, 'must have an access token');
          assert.equal(res.body.userId, 2);
          accessToken = res.body.id;
          json('get', `/api/users/me/teams?access_token=${accessToken}`)
            .expect(200, function(err, res){
              assert(Array.isArray(res.body));
              // user is member of 4 teams
              assert.equal(res.body.length, 4);
              done();
            });
        });
    });

    it('should show projects for a user', function(done) {
      json('post', '/api/users/login')
        .send({
          username: 'Jane',
          password: 'opensesame'
        })
        .expect(200, function(err, res) {
          assert(typeof res.body === 'object');
          assert(res.body.id, 'must have an access token');
          assert.equal(res.body.userId, 2);
          accessToken = res.body.id;
          json('get', `/api/users/me/projects?access_token=${accessToken}`)
            .expect(200, function(err, res){
              assert(Array.isArray(res.body));
              // user is owner of 2 projects
              assert.equal(res.body.length, 2);
              done();
            });
        });
    });

    it('should show project team for a user', function(done) {
      json('post', '/api/users/login')
        .send({
          username: 'Jane',
          password: 'opensesame'
        })
        .expect(200, function(err, res) {
          assert(typeof res.body === 'object');
          assert(res.body.id, 'must have an access token');
          assert.equal(res.body.userId, 2);
          accessToken = res.body.id;
          json('get', `/api/users/me/projects/2?access_token=${accessToken}`)
            .expect(200, function(err, res){
              assert(typeof res.body === 'object');
              assert.equal(res.body.ownerId, 2);
              done();
            });
        });
    });

    it('should show user info using currentUserLiteral', function(done) {
      json('post', '/api/users/login')
        .send({
          username: 'Bob',
          password: 'opensesame'
        })
        .expect(200, function(err, res) {
          accessToken = res.body.id;
          json('get', `/api/users/me?access_token=${accessToken}`)
            .expect(200, function(err, res){
              assert(typeof res.body === 'object');
              assert.equal(res.body.id, 3);
              assert.equal(res.body.username, 'Bob');
              done();
            });
        });
    });

  });
});

describe('Unexpected Usage', function(){
  it('should not crash the server when posting a bad id', function(done){
    json('post', '/api/users/foobar')
      .send({})
      .expect(404, done);
  });
});
