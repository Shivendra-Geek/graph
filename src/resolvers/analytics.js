const User = require('../models/user');
const Department = require('../models/department');
const Task = require('../models/task');
const { requireAdmin } = require('../middleware/auth');

const analyticsResolvers = {
  Query: {
    analytics: async (_, __, context) => {
      requireAdmin(context);

      const [totalEmployees, activeEmployees, totalDepartments, tasks] = await Promise.all([
        User.countDocuments({ role: 'employee' }),
        User.countDocuments({ role: 'employee', isActive: true }),
        Department.countDocuments(),
        Task.find({}, 'status priority'),
      ]);

      const count = (arr, field, val) => arr.filter((t) => t[field] === val).length;

      return {
        totalEmployees,
        activeEmployees,
        totalDepartments,
        totalTasks: tasks.length,
        tasksByStatus: {
          pending:    count(tasks, 'status', 'pending'),
          inProgress: count(tasks, 'status', 'in_progress'),
          completed:  count(tasks, 'status', 'completed'),
          cancelled:  count(tasks, 'status', 'cancelled'),
        },
        tasksByPriority: {
          low:    count(tasks, 'priority', 'low'),
          medium: count(tasks, 'priority', 'medium'),
          high:   count(tasks, 'priority', 'high'),
          urgent: count(tasks, 'priority', 'urgent'),
        },
      };
    },
  },
};

module.exports = analyticsResolvers;
