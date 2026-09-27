const db = require('../config/db.config');

// 1. GET /api/analytics/department-summary
// Aggregates total employees and average salary per department
exports.getDepartmentSummary = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        d.department_id,
        d.name AS department_name,
        d.code AS department_code,
        COUNT(e.employee_id) AS employee_count,
        COALESCE(ROUND(AVG(e.salary), 2), 0.00) AS average_salary
       FROM departments d
       LEFT JOIN employees e ON d.department_id = e.department_id
       GROUP BY d.department_id, d.name, d.code
       ORDER BY employee_count DESC, department_name ASC`
    );

    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department summary analytics',
      error: error.message
    });
  }
};

// 2. GET /api/analytics/project-summary
// Aggregates project members, tasks, budget allocations, and calculates budget utilization %
exports.getProjectSummary = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        p.project_id,
        p.name AS project_name,
        p.code AS project_code,
        p.status,
        COUNT(DISTINCT pm.employee_id) AS employee_count,
        COUNT(DISTINCT t.task_id) AS task_count,
        COALESCE(SUM(b.allocated_amount), 0.00) AS allocated_budget,
        COALESCE(SUM(b.spent_amount), 0.00) AS spent_budget,
        CASE 
          WHEN COALESCE(SUM(b.allocated_amount), 0.00) = 0 THEN 0.00
          ELSE ROUND((COALESCE(SUM(b.spent_amount), 0.00) / SUM(b.allocated_amount)) * 100, 2)
        END AS budget_utilization_percentage
       FROM projects p
       LEFT JOIN project_members pm ON p.project_id = pm.project_id
       LEFT JOIN tasks t ON p.project_id = t.project_id
       LEFT JOIN budgets b ON p.project_id = b.project_id
       GROUP BY p.project_id, p.name, p.code, p.status
       ORDER BY p.project_id DESC`
    );

    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project summary analytics',
      error: error.message
    });
  }
};

// 3. GET /api/analytics/employee-workload
// Calculates total assigned tasks, completed tasks, and pending tasks per employee using conditional aggregation
exports.getEmployeeWorkload = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        e.employee_id,
        e.first_name,
        e.last_name,
        e.email,
        d.name AS department_name,
        COUNT(t.task_id) AS assigned_task_count,
        COUNT(CASE WHEN t.status = 'done' THEN 1 END) AS completed_task_count,
        COUNT(CASE WHEN t.status IN ('todo', 'in_progress', 'review') THEN 1 END) AS pending_task_count
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.department_id
       LEFT JOIN tasks t ON e.employee_id = t.assigned_employee_id
       GROUP BY e.employee_id, e.first_name, e.last_name, e.email, d.name
       ORDER BY assigned_task_count DESC, e.last_name ASC`
    );

    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee workload analytics',
      error: error.message
    });
  }
};

// 4. GET /api/analytics/project-status
// Aggregates project counts grouped by project status
exports.getProjectStatusSummary = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        status,
        COUNT(project_id) AS project_count
       FROM projects
       GROUP BY status
       ORDER BY project_count DESC`
    );

    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project status analytics',
      error: error.message
    });
  }
};

// 5. GET /api/analytics/salary-ranking
// Ranks employees by salary within their department using SQL RANK() window function
exports.getSalaryRanking = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        e.employee_id,
        e.first_name,
        e.last_name,
        e.job_title,
        e.salary,
        d.name AS department_name,
        RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS salary_rank_in_department
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.department_id
       ORDER BY d.name ASC, salary_rank_in_department ASC`
    );

    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salary ranking analytics',
      error: error.message
    });
  }
};
