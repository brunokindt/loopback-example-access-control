const chalk = require('chalk');
const assert = require('assert');

module.exports = function(app) {
  var Role = app.models.Role;

  Role.registerResolver('teamMember', function(role, context, cb) {
    function reject() {
      process.nextTick(function() {
        cb(null, false);
      });
    }

    console.log(chalk.yellow('teamMember resolver, context:'), context.modelName, context.property);

    // if the target model is not shop
    if (context.modelName !== 'shop') {
      return reject();
    }

    // do not allow anonymous users
    var userId = context.accessToken.userId;
    if (!userId) {
      return reject();
    }

    // check if userId is in team table for the given shop id
    context.model.findById(context.modelId, function(err, shop) {

      if (err || !shop)
        return reject();

      var Team = app.models.Team;
      Team.count({
        shopId: shop.id,
        userId: userId
      }, function(err, count) {
        console.log('Has team member', count);
        if (err || typeof count !== 'number') {
          console.log(err);
          return cb(null, false);
        }

        cb(null, count > 0); // true = is a team member
        //cb(null, typeof teamMember !== 'undefined'); // true = is a team member
      });
    });
  });

};
