const User = require("../models/user");

const resolvers = {
  Query: {
    hello: () => "GraphQL Server Running 🚀",
    users: async () => {
      const users = await User.find();
      return users;
    },
    user: async (_, { id }) => {
      const user = await User.findById(id);
      return user;
    },
  }, 
  
  Mutation: {
    createUser: async (_, { input }) => {
      const existingUser = await User.findOne({
        email: input.email,
      });

      if (existingUser) {
        throw new Error("User already exists");
      }

      const user = await User.create(input);

      return user;
    },
  }


};

module.exports = resolvers;