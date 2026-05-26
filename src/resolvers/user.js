const User = require('../models/user');
const { authenticate, requireAdmin } = require('../middleware/auth');

const userResolvers = {
  Query: {
    me: async (_, __, context) => {
      const { userId } = authenticate(context);
      const user = await User.findById(userId).populate('department');
      if (!user) throw new Error('User not found');
      return user;
    },

    users: async (_, __, context) => {
      requireAdmin(context);
      return User.find().populate('department').sort({ createdAt: -1 });
    },

    user: async (_, { id }, context) => {
      requireAdmin(context);
      const user = await User.findById(id).populate('department');
      if (!user) throw new Error('Employee not found');
      return user;
    },
  },

  Mutation: {
    createEmployee: async (_, { input }, context) => {
      requireAdmin(context);
      const { departmentId, ...rest } = input;
      const data = { ...rest };
      if (departmentId) data.department = departmentId;

      const existing = await User.findOne({ email: data.email });
      if (existing) throw new Error('Email already registered');

      const user = await User.create(data);
      return User.findById(user._id).populate('department');
    },

    updateEmployee: async (_, { id, input }, context) => {
      requireAdmin(context);
      const { departmentId, ...rest } = input;
      const data = { ...rest };
      if (departmentId !== undefined) data.department = departmentId || null;

      const user = await User.findByIdAndUpdate(id, data, { new: true }).populate('department');
      if (!user) throw new Error('Employee not found');
      return user;
    },

    deleteEmployee: async (_, { id }, context) => {
      requireAdmin(context);
      const user = await User.findByIdAndDelete(id);
      if (!user) throw new Error('Employee not found');
      return true;
    },
  },
};

module.exports = userResolvers;
