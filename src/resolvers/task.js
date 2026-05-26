const Task = require('../models/task');
const { authenticate, requireAdmin } = require('../middleware/auth');

const populateTask = (query) =>
  query
    .populate('assignedTo')
    .populate('assignedBy')
    .populate({ path: 'department', populate: { path: 'head' } });

const taskResolvers = {
  Query: {
    tasks: async (_, { status, priority }, context) => {
      requireAdmin(context);
      const filter = {};
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      return populateTask(Task.find(filter).sort({ createdAt: -1 }));
    },

    myTasks: async (_, __, context) => {
      const { userId } = authenticate(context);
      return populateTask(Task.find({ assignedTo: userId }).sort({ createdAt: -1 }));
    },

    task: async (_, { id }, context) => {
      const { userId, role } = authenticate(context);
      const task = await populateTask(Task.findById(id));
      if (!task) throw new Error('Task not found');
      if (role !== 'admin' && task.assignedTo?._id.toString() !== userId) {
        throw new Error('Access denied');
      }
      return task;
    },
  },

  Mutation: {
    createTask: async (_, { input }, context) => {
      const { userId } = requireAdmin(context);
      const { assignedToId, departmentId, ...rest } = input;
      const data = { ...rest, assignedBy: userId };
      if (assignedToId) data.assignedTo = assignedToId;
      if (departmentId) data.department = departmentId;

      const task = await Task.create(data);
      return populateTask(Task.findById(task._id));
    },

    updateTask: async (_, { id, input }, context) => {
      requireAdmin(context);
      const { assignedToId, departmentId, ...rest } = input;
      const data = { ...rest };
      if (assignedToId !== undefined) data.assignedTo = assignedToId || null;
      if (departmentId !== undefined) data.department = departmentId || null;

      const task = await populateTask(Task.findByIdAndUpdate(id, data, { new: true }));
      if (!task) throw new Error('Task not found');
      return task;
    },

    deleteTask: async (_, { id }, context) => {
      requireAdmin(context);
      const task = await Task.findByIdAndDelete(id);
      if (!task) throw new Error('Task not found');
      return true;
    },

    assignTask: async (_, { taskId, employeeId }, context) => {
      requireAdmin(context);
      const task = await populateTask(
        Task.findByIdAndUpdate(taskId, { assignedTo: employeeId }, { new: true })
      );
      if (!task) throw new Error('Task not found');
      return task;
    },

    updateTaskStatus: async (_, { taskId, status, progress }, context) => {
      const { userId, role } = authenticate(context);
      const task = await Task.findById(taskId);
      if (!task) throw new Error('Task not found');

      if (role !== 'admin' && task.assignedTo?.toString() !== userId) {
        throw new Error('You can only update tasks assigned to you');
      }

      const update = { status };
      if (progress !== undefined && progress !== null) update.progress = progress;
      if (status === 'completed') {
        update.completedAt = new Date();
        update.progress = 100;
      }

      return populateTask(Task.findByIdAndUpdate(taskId, update, { new: true }));
    },
  },
};

module.exports = taskResolvers;
