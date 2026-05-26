const authResolvers       = require('./auth');
const userResolvers       = require('./user');
const departmentResolvers = require('./department');
const taskResolvers       = require('./task');
const analyticsResolvers  = require('./analytics');

module.exports = {
  Query: {
    ...userResolvers.Query,
    ...departmentResolvers.Query,
    ...taskResolvers.Query,
    ...analyticsResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
    ...departmentResolvers.Mutation,
    ...taskResolvers.Mutation,
  },
  Department: departmentResolvers.Department,
};
