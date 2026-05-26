const Department = require('../models/department');
const User = require('../models/user');
const { authenticate, requireAdmin } = require('../middleware/auth');

const departmentResolvers = {
  Query: {
    departments: async (_, __, context) => {
      authenticate(context);
      return Department.find().populate('head').sort({ name: 1 });
    },

    department: async (_, { id }, context) => {
      authenticate(context);
      const dept = await Department.findById(id).populate('head');
      if (!dept) throw new Error('Department not found');
      return dept;
    },
  },

  Department: {
    employeeCount: (parent) =>
      User.countDocuments({ department: parent._id }),
  },

  Mutation: {
    createDepartment: async (_, { input }, context) => {
      requireAdmin(context);
      const { headId, ...rest } = input;
      const data = { ...rest };
      if (headId) data.head = headId;

      const existing = await Department.findOne({ name: input.name });
      if (existing) throw new Error('Department name already exists');

      const dept = await Department.create(data);
      return Department.findById(dept._id).populate('head');
    },

    updateDepartment: async (_, { id, input }, context) => {
      requireAdmin(context);
      const { headId, ...rest } = input;
      const data = { ...rest };
      if (headId !== undefined) data.head = headId || null;

      const dept = await Department.findByIdAndUpdate(id, data, { new: true }).populate('head');
      if (!dept) throw new Error('Department not found');
      return dept;
    },

    deleteDepartment: async (_, { id }, context) => {
      requireAdmin(context);
      const dept = await Department.findByIdAndDelete(id);
      if (!dept) throw new Error('Department not found');
      // Unset department from employees that belonged to it
      await User.updateMany({ department: id }, { $unset: { department: '' } });
      return true;
    },
  },
};

module.exports = departmentResolvers;
