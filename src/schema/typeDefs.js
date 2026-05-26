const { gql } = require('graphql-tag');

const typeDefs = gql`
  # ─── Enums ────────────────────────────────────────────────────────────
  enum TaskStatus {
    pending
    in_progress
    completed
    cancelled
  }

  enum TaskPriority {
    low
    medium
    high
    urgent
  }

  enum UserRole {
    admin
    employee
  }

  # ─── Core Types ───────────────────────────────────────────────────────
  type User {
    id: ID!
    name: String!
    email: String!
    role: UserRole!
    department: Department
    position: String
    phone: String
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Department {
    id: ID!
    name: String!
    description: String
    head: User
    employeeCount: Int!
    createdAt: String!
    updatedAt: String!
  }

  type Task {
    id: ID!
    title: String!
    description: String
    assignedTo: User
    assignedBy: User
    department: Department
    status: TaskStatus!
    priority: TaskPriority!
    dueDate: String
    completedAt: String
    progress: Int!
    notes: String
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  # ─── Analytics ────────────────────────────────────────────────────────
  type TasksByStatus {
    pending: Int!
    inProgress: Int!
    completed: Int!
    cancelled: Int!
  }

  type TasksByPriority {
    low: Int!
    medium: Int!
    high: Int!
    urgent: Int!
  }

  type Analytics {
    totalEmployees: Int!
    activeEmployees: Int!
    totalDepartments: Int!
    totalTasks: Int!
    tasksByStatus: TasksByStatus!
    tasksByPriority: TasksByPriority!
  }

  # ─── Inputs ───────────────────────────────────────────────────────────
  input RegisterInput {
    name: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input UpdateProfileInput {
    name: String
    phone: String
    position: String
  }

  input CreateEmployeeInput {
    name: String!
    email: String!
    password: String!
    role: UserRole
    departmentId: ID
    position: String
    phone: String
  }

  input UpdateEmployeeInput {
    name: String
    role: UserRole
    departmentId: ID
    position: String
    phone: String
    isActive: Boolean
  }

  input CreateDepartmentInput {
    name: String!
    description: String
    headId: ID
  }

  input UpdateDepartmentInput {
    name: String
    description: String
    headId: ID
  }

  input CreateTaskInput {
    title: String!
    description: String
    assignedToId: ID
    departmentId: ID
    priority: TaskPriority
    dueDate: String
  }

  input UpdateTaskInput {
    title: String
    description: String
    assignedToId: ID
    departmentId: ID
    priority: TaskPriority
    dueDate: String
    notes: String
  }

  # ─── Queries ──────────────────────────────────────────────────────────
  type Query {
    # Auth
    me: User!

    # Employees (admin only)
    users: [User!]!
    user(id: ID!): User

    # Departments (authenticated)
    departments: [Department!]!
    department(id: ID!): Department

    # Tasks
    tasks(status: TaskStatus, priority: TaskPriority): [Task!]!   # admin only
    myTasks: [Task!]!                                               # own tasks
    task(id: ID!): Task

    # Analytics (admin only)
    analytics: Analytics!
  }

  # ─── Mutations ────────────────────────────────────────────────────────
  type Mutation {
    # Auth
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    updateProfile(input: UpdateProfileInput!): User!

    # Employee management (admin only)
    createEmployee(input: CreateEmployeeInput!): User!
    updateEmployee(id: ID!, input: UpdateEmployeeInput!): User!
    deleteEmployee(id: ID!): Boolean!

    # Department management (admin only)
    createDepartment(input: CreateDepartmentInput!): Department!
    updateDepartment(id: ID!, input: UpdateDepartmentInput!): Department!
    deleteDepartment(id: ID!): Boolean!

    # Task management
    createTask(input: CreateTaskInput!): Task!          # admin only
    updateTask(id: ID!, input: UpdateTaskInput!): Task! # admin only
    deleteTask(id: ID!): Boolean!                       # admin only
    assignTask(taskId: ID!, employeeId: ID!): Task!     # admin only
    updateTaskStatus(taskId: ID!, status: TaskStatus!, progress: Int): Task! # own tasks
  }
`;

module.exports = typeDefs;
