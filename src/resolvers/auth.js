const User = require('../models/user');
const { generateToken } = require('../utils/token');
const { authenticate } = require('../middleware/auth');

const authResolvers = {
  Mutation: {
    register: async (_, { input }) => {
      const existing = await User.findOne({ email: input.email });
      if (existing) throw new Error('Email already registered');

      const user = await User.create(input);
      const token = generateToken(user._id.toString(), user.role);
      return { token, user };
    },

    login: async (_, { input }) => {
      const user = await User.findOne({ email: input.email }).populate('department');
      if (!user) throw new Error('Invalid email or password');

      const valid = await user.comparePassword(input.password);
      if (!valid) throw new Error('Invalid email or password');

      if (!user.isActive) throw new Error('Account is deactivated. Contact an admin.');

      const token = generateToken(user._id.toString(), user.role);
      return { token, user };
    },

    updateProfile: async (_, { input }, context) => {
      const { userId } = authenticate(context);
      const user = await User.findByIdAndUpdate(userId, input, { new: true }).populate('department');
      if (!user) throw new Error('User not found');
      return user;
    },
  },
};

module.exports = authResolvers;
