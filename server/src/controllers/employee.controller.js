const db = require('../config/db.config');

// Helper to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// GET /api/employees - Get all employees with department name
exports.getAllEmployees = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        e.employee_id, 
        e.first_name, 
        e.last_name, 
        e.email, 
        e.job_title, 
        e.salary, 
        e.hire_date, 
        e.status, 
        e.department_id,
        d.name AS department_name,
        e.created_at, 
        e.updated_at
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.department_id
       ORDER BY e.employee_id DESC`
    );
    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message
    });
  }
};

// GET /api/employees/:id - Get single employee by ID with department name
exports.getEmployeeById = async (req, res) => {
  const { id } = req.params;

  if (isNaN(Number(id))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid employee ID parameter'
    });
  }

  try {
    const [rows] = await db.query(
      `SELECT 
        e.employee_id, 
        e.first_name, 
        e.last_name, 
        e.email, 
        e.job_title, 
        e.salary, 
        e.hire_date, 
        e.status, 
        e.department_id,
        d.name AS department_name,
        e.created_at, 
        e.updated_at
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.department_id
       WHERE e.employee_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee',
      error: error.message
    });
  }
};

// POST /api/employees - Create new employee
exports.createEmployee = async (req, res) => {
  const { 
    first_name, 
    last_name, 
    email, 
    job_title, 
    salary, 
    hire_date, 
    status, 
    department_id 
  } = req.body;

  // Field presence checks
  if (!first_name || !last_name || !email || !job_title || salary === undefined || !hire_date) {
    return res.status(400).json({
      success: false,
      message: 'Missing required employee fields: first_name, last_name, email, job_title, salary, hire_date'
    });
  }

  // Format checks
  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  if (isNaN(Number(salary)) || Number(salary) < 0) {
    return res.status(400).json({
      success: false,
      message: 'Salary must be a non-negative number'
    });
  }

  const validStatuses = ['active', 'on_leave', 'terminated'];
  const employeeStatus = status || 'active';
  if (!validStatuses.includes(employeeStatus)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  try {
    // If department_id is provided, verify department exists
    if (department_id !== undefined && department_id !== null) {
      if (isNaN(Number(department_id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department_id format'
        });
      }

      const [deptRows] = await db.query(
        'SELECT department_id FROM departments WHERE department_id = ?',
        [department_id]
      );

      if (deptRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Department with ID ${department_id} does not exist`
        });
      }
    }

    const [result] = await db.query(
      `INSERT INTO employees 
       (first_name, last_name, email, job_title, salary, hire_date, status, department_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name.trim(),
        last_name.trim(),
        email.trim().toLowerCase(),
        job_title.trim(),
        Number(salary),
        hire_date,
        employeeStatus,
        department_id || null
      ]
    );

    const [newEmployee] = await db.query(
      `SELECT 
        e.employee_id, 
        e.first_name, 
        e.last_name, 
        e.email, 
        e.job_title, 
        e.salary, 
        e.hire_date, 
        e.status, 
        e.department_id,
        d.name AS department_name,
        e.created_at, 
        e.updated_at
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.department_id
       WHERE e.employee_id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: newEmployee[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Employee with this email address already exists'
      });
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({
        success: false,
        message: 'Invalid department_id referenced'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create employee',
      error: error.message
    });
  }
};

// PUT /api/employees/:id - Update employee
exports.updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { 
    first_name, 
    last_name, 
    email, 
    job_title, 
    salary, 
    hire_date, 
    status, 
    department_id 
  } = req.body;

  if (isNaN(Number(id))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid employee ID parameter'
    });
  }

  try {
    const [existing] = await db.query(
      `SELECT employee_id FROM employees WHERE employee_id = ?`,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${id} not found`
      });
    }

    const updates = [];
    const values = [];

    if (first_name) {
      updates.push('first_name = ?');
      values.push(first_name.trim());
    }
    if (last_name) {
      updates.push('last_name = ?');
      values.push(last_name.trim());
    }
    if (email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
      updates.push('email = ?');
      values.push(email.trim().toLowerCase());
    }
    if (job_title) {
      updates.push('job_title = ?');
      values.push(job_title.trim());
    }
    if (salary !== undefined) {
      if (isNaN(Number(salary)) || Number(salary) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Salary must be a non-negative number'
        });
      }
      updates.push('salary = ?');
      values.push(Number(salary));
    }
    if (hire_date) {
      updates.push('hire_date = ?');
      values.push(hire_date);
    }
    if (status) {
      const validStatuses = ['active', 'on_leave', 'terminated'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }
      updates.push('status = ?');
      values.push(status);
    }
    if (department_id !== undefined) {
      if (department_id !== null) {
        if (isNaN(Number(department_id))) {
          return res.status(400).json({
            success: false,
            message: 'Invalid department_id format'
          });
        }

        const [deptRows] = await db.query(
          'SELECT department_id FROM departments WHERE department_id = ?',
          [department_id]
        );

        if (deptRows.length === 0) {
          return res.status(400).json({
            success: false,
            message: `Department with ID ${department_id} does not exist`
          });
        }
      }
      updates.push('department_id = ?');
      values.push(department_id || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided to update'
      });
    }

    values.push(id);

    await db.query(
      `UPDATE employees SET ${updates.join(', ')} WHERE employee_id = ?`,
      values
    );

    const [updatedEmployee] = await db.query(
      `SELECT 
        e.employee_id, 
        e.first_name, 
        e.last_name, 
        e.email, 
        e.job_title, 
        e.salary, 
        e.hire_date, 
        e.status, 
        e.department_id,
        d.name AS department_name,
        e.created_at, 
        e.updated_at
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.department_id
       WHERE e.employee_id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Employee with this email address already exists'
      });
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({
        success: false,
        message: 'Invalid department_id referenced'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: error.message
    });
  }
};

// DELETE /api/employees/:id - Delete employee
exports.deleteEmployee = async (req, res) => {
  const { id } = req.params;

  if (isNaN(Number(id))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid employee ID parameter'
    });
  }

  try {
    const [result] = await db.query(
      `DELETE FROM employees WHERE employee_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: `Employee with ID ${id} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee',
      error: error.message
    });
  }
};
