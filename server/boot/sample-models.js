const chalk = require('chalk');

module.exports = function(app) {
  var User = app.models.User;
  var Role = app.models.Role;
  var Shop = app.models.Shop;
  var Team = app.models.Team;

  var RoleMapping = app.models.RoleMapping;


  function logSample(modelName, sample) {
    sample = typeof sample.push === 'function' ? sample : [sample];
    console.log(chalk.magenta(`Created ${modelName}:`));
    sample.forEach( s => {
      console.log('\t', chalk.blue(JSON.stringify(s)));
    });
  }

  function createShops() {
    var shops = Array.from(new Array(5), (x,i) => ({ name: `shop ${i}` }) );
    return new Promise((resolve,  reject) => {
      Shop.create(shops, (err, shops) => {
        if (err) { reject(err); }
        logSample('shops', shops);
        resolve({shops: shops});
      });
    });
  }

  function createUsers(data) {
    var users = Array.from(new Array(8), (x,i) => ({
      username: i === 0 ? 'admin' : `user ${i}`,
      email: i === 0 ? 'admin@example.com' : `user${i}@example.com`,
      password: 'password'
    }));
    return new Promise((resolve, reject) => {
      User.create(users, function(err, users) {
        if (err) { reject(err); }
        logSample('users', users);
        data.users = users;
        resolve(data);
      });
    });
  }

  function createTeams(data) {
    var teams = Array.from(new Array(6), (x,i) => ({
      shopId: data.shops[Math.floor(i/4)].id,
      userId: data.users[i].id
    }));
    return new Promise((resolve, reject) => {
      Team.create(teams, function(err, teams) {
        if (err) { reject(err); }
        logSample('teams', teams);
        data.teams = teams;
        resolve(data);
      });
    });
  }

  function createRole(roleName, user) {
    return new Promise((resolve, reject) => {
      Role.create({
        name: roleName
      }, (err, role) => {
        if (err) { reject(err); }
        logSample('role', role);
        //make bob an admin
        role.principals.create({
          principalType: RoleMapping.USER,
          principalId: user.id
        }, function(err, principal) {
          if (err) { reject(err); }
          logSample('principal', principal);
          resolve(principal);
        });
      });
    });
  }

  createShops()
  .then( data => createUsers(data) )
  .then( data => createTeams(data) )
  .then( data => createRole('admin', data.users[0]) )
  .catch(err => {
    console.log(err);
  });

};
