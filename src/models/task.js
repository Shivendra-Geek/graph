const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    department:  { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    dueDate:     { type: Date },
    completedAt: { type: Date },
    progress:    { type: Number, default: 0, min: 0, max: 100 },
    notes:       { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
