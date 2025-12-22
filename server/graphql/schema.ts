import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    # Projects
    projects: [Project!]!
    project(id: ID!): Project
    
    # Tasks
    tasks(projectId: ID): [Task!]!
    task(id: ID!): Task
    
    # Analytics
    executiveKPIs: ExecutiveKPIs!
    projectHealth(projectId: ID!): ProjectHealth!
    
    # Comments
    comments(entityType: String!, entityId: ID!): [Comment!]!
    
    # Activity
    activityFeed(projectId: ID, limit: Int): [Activity!]!
  }

  type Mutation {
    # Projects
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    deleteProject(id: ID!): Boolean!
    
    # Tasks
    createTask(input: CreateTaskInput!): Task!
    updateTask(id: ID!, input: UpdateTaskInput!): Task!
    deleteTask(id: ID!): Boolean!
    
    # Comments
    createComment(input: CreateCommentInput!): Comment!
    updateComment(id: ID!, content: String!): Comment!
    deleteComment(id: ID!): Boolean!
  }

  # Types
  type Project {
    id: ID!
    name: String!
    description: String
    client: String
    location: String
    budget: Float
    actualCost: Float
    startDate: String
    endDate: String
    status: String!
    createdAt: String!
    tasks: [Task!]!
    comments: [Comment!]!
  }

  type Task {
    id: ID!
    projectId: ID!
    title: String!
    description: String
    status: String!
    priority: String!
    assigneeName: String
    dueDate: String
    startDate: String
    duration: Int
    progress: Int
    dependencies: [String]
    createdAt: String!
    project: Project!
    comments: [Comment!]!
  }

  type Comment {
    id: ID!
    entityType: String!
    entityId: ID!
    userId: ID!
    userName: String!
    content: String!
    mentions: [String]
    createdAt: String!
    updatedAt: String
  }

  type Activity {
    id: ID!
    userId: ID!
    userName: String!
    action: String!
    entityType: String!
    entityId: ID!
    metadata: JSON
    createdAt: String!
  }

  type ExecutiveKPIs {
    activeProjects: Int!
    budgetHealth: BudgetHealth!
    safetyScore: Int!
    teamVelocity: Int!
    openRFIs: Int!
  }

  type BudgetHealth {
    totalBudget: Float!
    totalSpent: Float!
    variance: Float!
    percentageUsed: String!
  }

  type ProjectHealth {
    overallHealth: Float!
    budgetHealth: Int!
    scheduleHealth: Int!
    safetyHealth: Int!
    metrics: ProjectMetrics!
  }

  type ProjectMetrics {
    tasks: TaskStats!
    budget: BudgetStats!
  }

  type TaskStats {
    total: Int!
    completed: Int!
    blocked: Int!
  }

  type BudgetStats {
    planned: Float!
    actual: Float!
    variance: Float!
  }

  # Inputs
  input CreateProjectInput {
    name: String!
    description: String
    client: String
    location: String
    budget: Float
    startDate: String
    endDate: String
  }

  input UpdateProjectInput {
    name: String
    description: String
    client: String
    location: String
    budget: Float
    startDate: String
    endDate: String
    status: String
  }

  input CreateTaskInput {
    projectId: ID!
    title: String!
    description: String
    status: String
    priority: String
    assigneeName: String
    dueDate: String
    startDate: String
    duration: Int
  }

  input UpdateTaskInput {
    title: String
    description: String
    status: String
    priority: String
    assigneeName: String
    dueDate: String
    progress: Int
  }

  input CreateCommentInput {
    entityType: String!
    entityId: ID!
    content: String!
    mentions: [String]
  }

  # Custom scalars
  scalar JSON
`;
