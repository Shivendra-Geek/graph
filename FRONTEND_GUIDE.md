# Employee & Task Management Platform — Frontend Integration Guide

**GraphQL Endpoint:** `http://localhost:4000/graphql`  
**Protocol:** HTTP POST, `Content-Type: application/json`  
**Auth:** `Authorization: Bearer <token>` header on all protected requests

---

## Table of Contents

1. [Base Setup](#1-base-setup)
2. [Authentication](#2-authentication)
3. [Profile](#3-profile)
4. [Employee Management](#4-employee-management)
5. [Department Management](#5-department-management)
6. [Task Management](#6-task-management)
7. [Analytics Dashboard](#7-analytics-dashboard)
8. [Error Handling](#8-error-handling)
9. [TypeScript Types](#9-typescript-types)
10. [Role & Permission Matrix](#10-role--permission-matrix)

---

## 1. Base Setup

### GraphQL Client Helper

Create a reusable function to call the API. This handles auth headers automatically.

```js
// lib/api.js

const API_URL = 'http://localhost:4000/graphql';

export async function gqlRequest(query, variables = {}) {
  const token = localStorage.getItem('token');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();

  if (json.errors) {
    // Throw the first GraphQL error message
    throw new Error(json.errors[0].message);
  }

  return json.data;
}
```

### Usage pattern across all examples below

```js
import { gqlRequest } from './lib/api';

try {
  const data = await gqlRequest(QUERY_STRING, { variable1: value1 });
  console.log(data);
} catch (err) {
  console.error(err.message); // e.g. "Authentication required"
}
```

---

## 2. Authentication

### 2.1 Register

**Role required:** Public  
**Returns:** JWT token + user object

```js
const REGISTER = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        name
        email
        role
        isActive
        createdAt
      }
    }
  }
`;

async function register(name, email, password) {
  const data = await gqlRequest(REGISTER, {
    input: { name, email, password },
  });

  localStorage.setItem('token', data.register.token);
  localStorage.setItem('user', JSON.stringify(data.register.user));

  return data.register;
}
```

**Success response:**
```json
{
  "register": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "665a1b2c3d4e5f6a7b8c9d0e",
      "name": "John Doe",
      "email": "john@company.com",
      "role": "employee",
      "isActive": true,
      "createdAt": "2025-05-26T10:00:00.000Z"
    }
  }
}
```

**Possible errors:**
| Message | Cause |
|---|---|
| `Email already registered` | Email is taken |

---

### 2.2 Login

**Role required:** Public  
**Returns:** JWT token + user object

```js
const LOGIN = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        name
        email
        role
        isActive
        department {
          id
          name
        }
      }
    }
  }
`;

async function login(email, password) {
  const data = await gqlRequest(LOGIN, {
    input: { email, password },
  });

  localStorage.setItem('token', data.login.token);
  localStorage.setItem('user', JSON.stringify(data.login.user));

  return data.login;
}
```

**Success response:**
```json
{
  "login": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "665a1b2c3d4e5f6a7b8c9d0e",
      "name": "John Doe",
      "email": "john@company.com",
      "role": "employee",
      "isActive": true,
      "department": {
        "id": "665a1b2c3d4e5f6a7b8c9d1f",
        "name": "Engineering"
      }
    }
  }
}
```

**Possible errors:**
| Message | Cause |
|---|---|
| `Invalid email or password` | Wrong credentials |
| `Account is deactivated. Contact an admin.` | Admin disabled the account |

---

### 2.3 Logout

No server call needed — just clear local storage.

```js
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}
```

---

## 3. Profile

### 3.1 Get My Profile

**Role required:** Any authenticated user  
**Header:** `Authorization: Bearer <token>`

```js
const ME = `
  query {
    me {
      id
      name
      email
      role
      position
      phone
      isActive
      department {
        id
        name
        description
      }
      createdAt
      updatedAt
    }
  }
`;

async function getMyProfile() {
  const data = await gqlRequest(ME);
  return data.me;
}
```

**Success response:**
```json
{
  "me": {
    "id": "665a1b2c3d4e5f6a7b8c9d0e",
    "name": "John Doe",
    "email": "john@company.com",
    "role": "employee",
    "position": "Senior Developer",
    "phone": "+1-555-0100",
    "isActive": true,
    "department": {
      "id": "665a1b2c3d4e5f6a7b8c9d1f",
      "name": "Engineering",
      "description": "Builds all products"
    },
    "createdAt": "2025-05-26T10:00:00.000Z",
    "updatedAt": "2025-05-26T10:00:00.000Z"
  }
}
```

---

### 3.2 Update My Profile

**Role required:** Any authenticated user  
**Fields:** all optional — send only what changed

```js
const UPDATE_PROFILE = `
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      name
      phone
      position
      updatedAt
    }
  }
`;

async function updateProfile({ name, phone, position }) {
  const data = await gqlRequest(UPDATE_PROFILE, {
    input: { name, phone, position },
  });
  return data.updateProfile;
}
```

**Variables:**
```json
{
  "input": {
    "name": "John D.",
    "phone": "+1-555-0200",
    "position": "Lead Developer"
  }
}
```

**Success response:**
```json
{
  "updateProfile": {
    "id": "665a1b2c3d4e5f6a7b8c9d0e",
    "name": "John D.",
    "phone": "+1-555-0200",
    "position": "Lead Developer",
    "updatedAt": "2025-05-26T11:00:00.000Z"
  }
}
```

---

## 4. Employee Management

> All endpoints in this section require **Admin** role.

### 4.1 Get All Employees

```js
const GET_USERS = `
  query {
    users {
      id
      name
      email
      role
      position
      phone
      isActive
      department {
        id
        name
      }
      createdAt
    }
  }
`;

async function getAllEmployees() {
  const data = await gqlRequest(GET_USERS);
  return data.users;
}
```

**Success response:**
```json
{
  "users": [
    {
      "id": "665a1b2c3d4e5f6a7b8c9d0e",
      "name": "John Doe",
      "email": "john@company.com",
      "role": "employee",
      "position": "Developer",
      "phone": "+1-555-0100",
      "isActive": true,
      "department": { "id": "...", "name": "Engineering" },
      "createdAt": "2025-05-26T10:00:00.000Z"
    }
  ]
}
```

---

### 4.2 Get Single Employee

```js
const GET_USER = `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
      role
      position
      phone
      isActive
      department {
        id
        name
        description
      }
      createdAt
      updatedAt
    }
  }
`;

async function getEmployee(id) {
  const data = await gqlRequest(GET_USER, { id });
  return data.user;
}
```

**Possible errors:**
| Message | Cause |
|---|---|
| `Employee not found` | Invalid ID |

---

### 4.3 Create Employee

```js
const CREATE_EMPLOYEE = `
  mutation CreateEmployee($input: CreateEmployeeInput!) {
    createEmployee(input: $input) {
      id
      name
      email
      role
      position
      phone
      isActive
      department {
        id
        name
      }
      createdAt
    }
  }
`;

async function createEmployee({ name, email, password, role, position, phone, departmentId }) {
  const data = await gqlRequest(CREATE_EMPLOYEE, {
    input: { name, email, password, role, position, phone, departmentId },
  });
  return data.createEmployee;
}
```

**Variables:**
```json
{
  "input": {
    "name": "Jane Smith",
    "email": "jane@company.com",
    "password": "securePass123",
    "role": "employee",
    "position": "UI Designer",
    "phone": "+1-555-0300",
    "departmentId": "665a1b2c3d4e5f6a7b8c9d1f"
  }
}
```

**`role` values:** `employee` | `admin`  
**`departmentId`:** optional

**Possible errors:**
| Message | Cause |
|---|---|
| `Email already registered` | Email is already in use |

---

### 4.4 Update Employee

```js
const UPDATE_EMPLOYEE = `
  mutation UpdateEmployee($id: ID!, $input: UpdateEmployeeInput!) {
    updateEmployee(id: $id, input: $input) {
      id
      name
      role
      position
      phone
      isActive
      department {
        id
        name
      }
      updatedAt
    }
  }
`;

async function updateEmployee(id, fields) {
  const data = await gqlRequest(UPDATE_EMPLOYEE, { id, input: fields });
  return data.updateEmployee;
}
```

**Variables:**
```json
{
  "id": "665a1b2c3d4e5f6a7b8c9d0e",
  "input": {
    "position": "Senior Designer",
    "isActive": true,
    "departmentId": "665a1b2c3d4e5f6a7b8c9d1f"
  }
}
```

> Send only the fields you want to change. All fields in `UpdateEmployeeInput` are optional.

---

### 4.5 Delete Employee

```js
const DELETE_EMPLOYEE = `
  mutation DeleteEmployee($id: ID!) {
    deleteEmployee(id: $id)
  }
`;

async function deleteEmployee(id) {
  const data = await gqlRequest(DELETE_EMPLOYEE, { id });
  return data.deleteEmployee; // true
}
```

**Possible errors:**
| Message | Cause |
|---|---|
| `Employee not found` | Invalid ID |

---

## 5. Department Management

### 5.1 Get All Departments

**Role required:** Any authenticated user

```js
const GET_DEPARTMENTS = `
  query {
    departments {
      id
      name
      description
      employeeCount
      head {
        id
        name
        email
        position
      }
      createdAt
    }
  }
`;

async function getAllDepartments() {
  const data = await gqlRequest(GET_DEPARTMENTS);
  return data.departments;
}
```

**Success response:**
```json
{
  "departments": [
    {
      "id": "665a1b2c3d4e5f6a7b8c9d1f",
      "name": "Engineering",
      "description": "Builds all products",
      "employeeCount": 12,
      "head": {
        "id": "665a1b2c3d4e5f6a7b8c9d0e",
        "name": "Alice",
        "email": "alice@company.com",
        "position": "VP Engineering"
      },
      "createdAt": "2025-05-26T10:00:00.000Z"
    }
  ]
}
```

---

### 5.2 Get Single Department

**Role required:** Any authenticated user

```js
const GET_DEPARTMENT = `
  query GetDepartment($id: ID!) {
    department(id: $id) {
      id
      name
      description
      employeeCount
      head {
        id
        name
        position
      }
      createdAt
      updatedAt
    }
  }
`;

async function getDepartment(id) {
  const data = await gqlRequest(GET_DEPARTMENT, { id });
  return data.department;
}
```

---

### 5.3 Create Department

**Role required:** Admin

```js
const CREATE_DEPARTMENT = `
  mutation CreateDepartment($input: CreateDepartmentInput!) {
    createDepartment(input: $input) {
      id
      name
      description
      head {
        id
        name
      }
      createdAt
    }
  }
`;

async function createDepartment({ name, description, headId }) {
  const data = await gqlRequest(CREATE_DEPARTMENT, {
    input: { name, description, headId },
  });
  return data.createDepartment;
}
```

**Variables:**
```json
{
  "input": {
    "name": "Design",
    "description": "Handles all product design",
    "headId": "665a1b2c3d4e5f6a7b8c9d0e"
  }
}
```

**`headId`:** optional  
**Possible errors:**
| Message | Cause |
|---|---|
| `Department name already exists` | Duplicate name |

---

### 5.4 Update Department

**Role required:** Admin

```js
const UPDATE_DEPARTMENT = `
  mutation UpdateDepartment($id: ID!, $input: UpdateDepartmentInput!) {
    updateDepartment(id: $id, input: $input) {
      id
      name
      description
      head {
        id
        name
      }
      updatedAt
    }
  }
`;

async function updateDepartment(id, fields) {
  const data = await gqlRequest(UPDATE_DEPARTMENT, { id, input: fields });
  return data.updateDepartment;
}
```

---

### 5.5 Delete Department

**Role required:** Admin  
> Employees in this department will have their department field cleared automatically.

```js
const DELETE_DEPARTMENT = `
  mutation DeleteDepartment($id: ID!) {
    deleteDepartment(id: $id)
  }
`;

async function deleteDepartment(id) {
  const data = await gqlRequest(DELETE_DEPARTMENT, { id });
  return data.deleteDepartment; // true
}
```

---

## 6. Task Management

### 6.1 Get All Tasks (with filters)

**Role required:** Admin  
**Filters:** both optional

```js
const GET_TASKS = `
  query GetTasks($status: TaskStatus, $priority: TaskPriority) {
    tasks(status: $status, priority: $priority) {
      id
      title
      description
      status
      priority
      progress
      dueDate
      completedAt
      notes
      assignedTo {
        id
        name
        email
      }
      assignedBy {
        id
        name
      }
      department {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

// Get all tasks
async function getAllTasks() {
  const data = await gqlRequest(GET_TASKS, {});
  return data.tasks;
}

// Get filtered tasks
async function getFilteredTasks(status, priority) {
  const data = await gqlRequest(GET_TASKS, { status, priority });
  return data.tasks;
}
```

**`status` values:** `pending` | `in_progress` | `completed` | `cancelled`  
**`priority` values:** `low` | `medium` | `high` | `urgent`

**Example — filter by status:**
```js
const inProgressTasks = await getFilteredTasks('in_progress', null);
const urgentTasks     = await getFilteredTasks(null, 'urgent');
const urgentAndActive = await getFilteredTasks('in_progress', 'urgent');
```

**Success response:**
```json
{
  "tasks": [
    {
      "id": "665a1b2c3d4e5f6a7b8c9d2a",
      "title": "Redesign Login Page",
      "description": "Update UI to new brand",
      "status": "in_progress",
      "priority": "high",
      "progress": 60,
      "dueDate": "2025-06-30T00:00:00.000Z",
      "completedAt": null,
      "notes": null,
      "assignedTo": { "id": "...", "name": "Jane Smith", "email": "jane@company.com" },
      "assignedBy": { "id": "...", "name": "Admin User" },
      "department": { "id": "...", "name": "Design" },
      "createdAt": "2025-05-26T10:00:00.000Z",
      "updatedAt": "2025-05-26T12:00:00.000Z"
    }
  ]
}
```

---

### 6.2 Get My Tasks

**Role required:** Any authenticated user  
**Returns:** Only tasks assigned to the logged-in user

```js
const MY_TASKS = `
  query {
    myTasks {
      id
      title
      description
      status
      priority
      progress
      dueDate
      completedAt
      notes
      assignedBy {
        id
        name
      }
      department {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

async function getMyTasks() {
  const data = await gqlRequest(MY_TASKS);
  return data.myTasks;
}
```

---

### 6.3 Get Single Task

**Role required:** Admin (any task) | Employee (only their own task)

```js
const GET_TASK = `
  query GetTask($id: ID!) {
    task(id: $id) {
      id
      title
      description
      status
      priority
      progress
      dueDate
      completedAt
      notes
      assignedTo {
        id
        name
        email
        position
      }
      assignedBy {
        id
        name
      }
      department {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

async function getTask(id) {
  const data = await gqlRequest(GET_TASK, { id });
  return data.task;
}
```

**Possible errors:**
| Message | Cause |
|---|---|
| `Task not found` | Invalid ID |
| `Access denied` | Employee trying to view someone else's task |

---

### 6.4 Create Task

**Role required:** Admin

```js
const CREATE_TASK = `
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      title
      description
      status
      priority
      progress
      dueDate
      assignedTo {
        id
        name
      }
      department {
        id
        name
      }
      createdAt
    }
  }
`;

async function createTask({ title, description, assignedToId, departmentId, priority, dueDate }) {
  const data = await gqlRequest(CREATE_TASK, {
    input: { title, description, assignedToId, departmentId, priority, dueDate },
  });
  return data.createTask;
}
```

**Variables:**
```json
{
  "input": {
    "title": "Redesign Login Page",
    "description": "Update UI to match new brand guidelines",
    "assignedToId": "665a1b2c3d4e5f6a7b8c9d0e",
    "departmentId": "665a1b2c3d4e5f6a7b8c9d1f",
    "priority": "high",
    "dueDate": "2025-06-30"
  }
}
```

**`assignedToId` and `departmentId`:** optional  
**`priority` default:** `medium`  
**`status` default:** `pending`  
**`progress` default:** `0`

---

### 6.5 Update Task

**Role required:** Admin

```js
const UPDATE_TASK = `
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) {
      id
      title
      description
      priority
      dueDate
      notes
      assignedTo {
        id
        name
      }
      department {
        id
        name
      }
      updatedAt
    }
  }
`;

async function updateTask(id, fields) {
  const data = await gqlRequest(UPDATE_TASK, { id, input: fields });
  return data.updateTask;
}
```

**Variables:**
```json
{
  "id": "665a1b2c3d4e5f6a7b8c9d2a",
  "input": {
    "title": "Redesign Login & Signup Pages",
    "priority": "urgent",
    "dueDate": "2025-06-15",
    "notes": "Client moved deadline up"
  }
}
```

---

### 6.6 Assign Task to Employee

**Role required:** Admin

```js
const ASSIGN_TASK = `
  mutation AssignTask($taskId: ID!, $employeeId: ID!) {
    assignTask(taskId: $taskId, employeeId: $employeeId) {
      id
      title
      status
      assignedTo {
        id
        name
        email
      }
    }
  }
`;

async function assignTask(taskId, employeeId) {
  const data = await gqlRequest(ASSIGN_TASK, { taskId, employeeId });
  return data.assignTask;
}
```

---

### 6.7 Update Task Status / Progress

**Role required:** Admin (any task) | Employee (only their own task)  
> Use this for employees to report progress. When status is set to `completed`, progress auto-sets to `100` and `completedAt` is stamped.

```js
const UPDATE_TASK_STATUS = `
  mutation UpdateTaskStatus($taskId: ID!, $status: TaskStatus!, $progress: Int) {
    updateTaskStatus(taskId: $taskId, status: $status, progress: $progress) {
      id
      title
      status
      progress
      completedAt
      updatedAt
    }
  }
`;

async function updateTaskStatus(taskId, status, progress) {
  const data = await gqlRequest(UPDATE_TASK_STATUS, { taskId, status, progress });
  return data.updateTaskStatus;
}
```

**Usage examples:**
```js
// Start working
await updateTaskStatus('TASK_ID', 'in_progress', 10);

// Report 60% done
await updateTaskStatus('TASK_ID', 'in_progress', 60);

// Mark as complete (progress auto-becomes 100)
await updateTaskStatus('TASK_ID', 'completed');

// Cancel
await updateTaskStatus('TASK_ID', 'cancelled');
```

**Possible errors:**
| Message | Cause |
|---|---|
| `Task not found` | Invalid task ID |
| `You can only update tasks assigned to you` | Employee accessing another's task |

---

### 6.8 Delete Task

**Role required:** Admin

```js
const DELETE_TASK = `
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`;

async function deleteTask(id) {
  const data = await gqlRequest(DELETE_TASK, { id });
  return data.deleteTask; // true
}
```

---

## 7. Analytics Dashboard

**Role required:** Admin  
**Use this to power the admin dashboard home screen.**

```js
const GET_ANALYTICS = `
  query {
    analytics {
      totalEmployees
      activeEmployees
      totalDepartments
      totalTasks
      tasksByStatus {
        pending
        inProgress
        completed
        cancelled
      }
      tasksByPriority {
        low
        medium
        high
        urgent
      }
    }
  }
`;

async function getAnalytics() {
  const data = await gqlRequest(GET_ANALYTICS);
  return data.analytics;
}
```

**Success response:**
```json
{
  "analytics": {
    "totalEmployees": 24,
    "activeEmployees": 22,
    "totalDepartments": 5,
    "totalTasks": 47,
    "tasksByStatus": {
      "pending": 10,
      "inProgress": 18,
      "completed": 15,
      "cancelled": 4
    },
    "tasksByPriority": {
      "low": 8,
      "medium": 20,
      "high": 14,
      "urgent": 5
    }
  }
}
```

---

## 8. Error Handling

### GraphQL Error Shape

Every error comes back as:
```json
{
  "errors": [
    {
      "message": "Authentication required",
      "locations": [...],
      "path": [...]
    }
  ]
}
```

### Centralized Handler

```js
// lib/api.js (extended)

export async function gqlRequest(query, variables = {}) {
  const token = localStorage.getItem('token');

  const res = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();

  if (json.errors) {
    const message = json.errors[0].message;

    // Auto-logout on auth errors
    if (message === 'Authentication required' || message === 'Invalid or expired token') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    throw new Error(message);
  }

  return json.data;
}
```

### All Possible Error Messages

| Error Message | When It Occurs |
|---|---|
| `Authentication required` | No token sent |
| `Invalid or expired token` | Token is wrong or expired |
| `Admin access required` | Employee hitting admin-only route |
| `Email already registered` | `register` or `createEmployee` with duplicate email |
| `Invalid email or password` | Wrong login credentials |
| `Account is deactivated. Contact an admin.` | Admin set `isActive: false` |
| `Employee not found` | Invalid employee ID |
| `Department not found` | Invalid department ID |
| `Department name already exists` | Duplicate department name |
| `Task not found` | Invalid task ID |
| `Access denied` | Employee accessing another's task |
| `You can only update tasks assigned to you` | Employee updating status of unowned task |

---

## 9. TypeScript Types

```ts
// types/api.ts

export type UserRole = 'admin' | 'employee';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Department {
  id: string;
  name: string;
  description?: string;
  employeeCount: number;
  head?: User;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: Department;
  position?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo?: User;
  assignedBy?: User;
  department?: Department;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  dueDate?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthPayload {
  token: string;
  user: User;
}

export interface TasksByStatus {
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export interface TasksByPriority {
  low: number;
  medium: number;
  high: number;
  urgent: number;
}

export interface Analytics {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  totalTasks: number;
  tasksByStatus: TasksByStatus;
  tasksByPriority: TasksByPriority;
}
```

---

## 10. Role & Permission Matrix

| Endpoint | Employee | Admin |
|---|:---:|:---:|
| `register` | public | public |
| `login` | public | public |
| `me` | yes | yes |
| `updateProfile` | yes | yes |
| `departments` | yes | yes |
| `department(id)` | yes | yes |
| `myTasks` | yes | yes |
| `task(id)` — own only | yes | yes |
| `updateTaskStatus` — own only | yes | yes |
| `users` | no | yes |
| `user(id)` | no | yes |
| `createEmployee` | no | yes |
| `updateEmployee` | no | yes |
| `deleteEmployee` | no | yes |
| `createDepartment` | no | yes |
| `updateDepartment` | no | yes |
| `deleteDepartment` | no | yes |
| `tasks` (all) | no | yes |
| `createTask` | no | yes |
| `updateTask` | no | yes |
| `assignTask` | no | yes |
| `deleteTask` | no | yes |
| `analytics` | no | yes |

---

## Quick Reference — Recommended Screen → Endpoint Map

| Screen | Endpoints to Call |
|---|---|
| Login page | `login` |
| Register page | `register` |
| Employee dashboard | `me`, `myTasks` |
| Task detail (employee) | `task(id)`, `updateTaskStatus` |
| Profile settings | `me`, `updateProfile` |
| Admin home | `analytics` |
| Admin employee list | `users` |
| Admin employee detail | `user(id)` |
| Admin add employee | `createEmployee`, `departments` (for dropdown) |
| Admin edit employee | `updateEmployee`, `departments` |
| Admin department list | `departments` |
| Admin add department | `createDepartment`, `users` (for head dropdown) |
| Admin task list | `tasks(status, priority)` |
| Admin create task | `createTask`, `users`, `departments` |
| Admin assign task | `assignTask`, `users` |
| Admin edit task | `updateTask` |



--- 
## MindMap
Employee & Task Management Platform
│
├── 1. Base Setup
│   ├── GraphQL Endpoint
│   │   └── http://localhost:4000/graphql
│   ├── HTTP POST Requests
│   ├── Authorization Header
│   │   └── Bearer Token
│   └── gqlRequest Helper
│       ├── Handles fetch
│       ├── Adds token automatically
│       ├── Parses JSON
│       └── Handles GraphQL errors
│
├── 2. Authentication
│   ├── Register
│   │   ├── Public access
│   │   ├── Returns JWT token
│   │   └── Stores token + user in localStorage
│   │
│   ├── Login
│   │   ├── Public access
│   │   ├── Returns JWT token
│   │   ├── Returns department info
│   │   └── Stores session locally
│   │
│   └── Logout
│       ├── Clear token
│       ├── Clear user
│       └── Redirect to login
│
├── 3. Profile
│   ├── Get My Profile
│   │   ├── Auth required
│   │   ├── User details
│   │   └── Department details
│   │
│   └── Update Profile
│       ├── Update name
│       ├── Update phone
│       └── Update position
│
├── 4. Employee Management (Admin Only)
│   ├── Get All Employees
│   ├── Get Single Employee
│   ├── Create Employee
│   │   ├── Name
│   │   ├── Email
│   │   ├── Password
│   │   ├── Role
│   │   └── Department
│   │
│   ├── Update Employee
│   └── Delete Employee
│
├── 5. Department Management
│   ├── Get All Departments
│   ├── Get Single Department
│   ├── Create Department (Admin)
│   ├── Update Department (Admin)
│   └── Delete Department (Admin)
│
├── 6. Task Management
│   ├── Get All Tasks (Admin)
│   │   ├── Filter by status
│   │   └── Filter by priority
│   │
│   ├── Get My Tasks
│   ├── Get Single Task
│   ├── Create Task (Admin)
│   │   ├── Title
│   │   ├── Description
│   │   ├── Assigned Employee
│   │   ├── Department
│   │   ├── Priority
│   │   └── Due Date
│   │
│   ├── Update Task (Admin)
│   ├── Assign Task (Admin)
│   ├── Update Task Status
│   │   ├── pending
│   │   ├── in_progress
│   │   ├── completed
│   │   └── cancelled
│   │
│   └── Delete Task (Admin)
│
├── 7. Analytics Dashboard (Admin)
│   ├── Total Employees
│   ├── Active Employees
│   ├── Total Departments
│   ├── Total Tasks
│   ├── Tasks by Status
│   └── Tasks by Priority
│
├── 8. Error Handling
│   ├── Authentication required
│   ├── Invalid token
│   ├── Access denied
│   ├── Duplicate email
│   ├── Department exists
│   ├── Employee not found
│   └── Task not found
│
├── 9. TypeScript Types
│   ├── User
│   ├── Department
│   ├── Task
│   ├── Analytics
│   ├── TaskStatus
│   └── TaskPriority
│
├── 10. Roles & Permissions
│   ├── Employee
│   │   ├── View own tasks
│   │   ├── Update own task status
│   │   ├── View departments
│   │   └── Update profile
│   │
│   └── Admin
│       ├── Manage employees
│       ├── Manage departments
│       ├── Manage all tasks
│       ├── Assign tasks
│       └── Access analytics
│
└── Frontend Screens
    ├── Login Page → login
    ├── Register Page → register
    ├── Employee Dashboard → me + myTasks
    ├── Profile Settings → updateProfile
    ├── Admin Dashboard → analytics
    ├── Employee List → users
    ├── Department List → departments
    ├── Task List → tasks
    └── Task Detail → task + updateTaskStatus