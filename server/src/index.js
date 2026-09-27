const express = require('express');
const cors = require('cors');
require('dotenv').config();

const healthRoutes = require('./routes/health.routes');
const departmentRoutes = require('./routes/department.routes');
const employeeRoutes = require('./routes/employee.routes');
const projectRoutes = require('./routes/project.routes');
const projectMemberRoutes = require('./routes/projectMember.routes');
const taskRoutes = require('./routes/task.routes');
const budgetRoutes = require('./routes/budget.routes');
const analyticsRoutes = require('./routes/analytics.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', healthRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/project-members', projectMemberRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('DataDesk API Services');
});

// Start Server
app.listen(PORT, () => {
  console.log(`[DataDesk Server] Running on port ${PORT}`);
});
