const db = require('../config/db.config');

const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const VALID_STATUSES = ['todo', 'in_progress', 'review', 'done'];

// Helper to validate YYYY-MM-DD date format
const isValidDate = (dateString) => {
  if (!dateString) return false;
  const regEx = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString.match(regEx)) return false;
  const d = new Date(dateString);
  const dNum = d.getTime();
  if (!dNum && dNum !== 0) return false;
  return d.toISOString().slice(0, 10) === dateString;
};

// GET /api/tasks - Get all tasks with project and employee details
exports.getAllTasks = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        t.task_id, 
        t.project_id, 
        t.assigned_employee_id, 
        t.title, 
        t.description, 
        t.priority, 
        t.status, 
        t.due_date,
        t.created_at, 
        t.updated_at,
        p.name AS project_name,
        e.first_name AS employee_first_name,
        e.last_name AS employee_last_name
       FROM tasks t
       JOIN projects p ON t.project_id = p.project_id
       LEFT JOIN employees e ON t.assigned_employee_id = e.employee_id
       ORDER BY t.task_id DESC`
    );
    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message
    });
  }
};

// GET /api/tasks/:id - Get single task by ID with project and employee details
exports.getTaskById = async (req, res) => {
  const { id } = req.params;

  if (isNaN(Number(id))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid task ID parameter'
    });
  }

  try {
    const [rows] = await db.query(
      `SELECT 
        t.task_id, 
        t.project_id, 
        t.assigned_employee_id, 
        t.title, 
        t.description, 
        t.priority, 
        t.status, 
        t.due_date,
        t.created_at, 
        t.updated_at,
        p.name AS project_name,
        e.first_name AS employee_first_name,
        e.last_name AS employee_last_name
       FROM tasks t
       JOIN projects p ON t.project_id = p.project_id
       LEFT JOIN employees e ON t.assigned_employee_id = e.employee_id
       WHERE t.task_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task',
      error: error.message
    });
  }
};

// POST /api/tasks - Create new task
exports.createTask = async (req, res) => {
  const { 
    project_id, 
    assigned_employee_id, 
    title, 
    description, 
    priority, 
    status, 
    due_date 
  } = req.body;

  if (!project_id || !title) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: project_id and title'
    });
  }

  if (isNaN(Number(project_id))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid project_id format'
    });
  }

  const taskPriority = priority || 'medium';
  if (!VALID_PRIORITIES.includes(taskPriority)) {
    return res.status(400).json({
      success: false,
      message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`
    });
  }

  const taskStatus = status || 'todo';
  if (!VALID_STATUSES.includes(taskStatus)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
    });
  }

  if (due_date && !isValidDate(due_date)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid due_date format. Must be YYYY-MM-DD'
    });
  }

  try {
    // Validate project existence
    const [projRows] = await db.query(
      'SELECT project_id FROM projects WHERE project_id = ?',
      [project_id]
    );
    if (projRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Project with ID ${project_id} does not exist`
      });
    }

    // Validate assigned employee existence if provided
    if (assigned_employee_id !== undefined && assigned_employee_id !== null) {
      if (isNaN(Number(assigned_employee_id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid assigned_employee_id format'
        });
      }

      const [empRows] = await db.query(
        'SELECT employee_id FROM employees WHERE employee_id = ?',
        [assigned_employee_id]
      );
      if (empRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Employee with ID ${assigned_employee_id} does not exist`
        });
      }
    }

    const [result] = await db.query(
      `INSERT INTO tasks 
       (project_id, assigned_employee_id, title, description, priority, status, due_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        project_id,
        assigned_employee_id || null,
        title.trim(),
        description ? description.trim() : null,
        taskPriority,
        taskStatus,
        due_date || null
      ]
    );

    const [newTask] = await db.query(
      `SELECT 
        t.task_id, 
        t.project_id, 
        t.assigned_employee_id, 
        t.title, 
        t.description, 
        t.priority, 
        t.status, 
        t.due_date,
        t.created_at, 
        t.updated_at,
        p.name AS project_name,
        e.first_name AS employee_first_name,
        e.last_name AS employee_last_name
       FROM tasks t
       JOIN projects p ON t.project_id = p.project_id
       LEFT JOIN employees e ON t.assigned_employee_id = e.employee_id
       WHERE t.task_id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: newTask[0]
    });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({
        success: false,
        message: 'Invalid project_id or assigned_employee_id referenced'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message
    });
  }
};

// PUT /api/tasks/:id - Update task
exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { 
    project_id, 
    assigned_employee_id, 
    title, 
    description, 
    priority, 
    status, 
    due_date 
  } = req.body;

  if (isNaN(Number(id))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid task ID parameter'
    });
  }

  try {
    const [existing] = await db.query(
      `SELECT task_id FROM tasks WHERE task_id = ?`,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${id} not found`
      });
    }

    const updates = [];
    const values = [];

    if (project_id !== undefined) {
      if (isNaN(Number(project_id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project_id format'
        });
      }
      const [projRows] = await db.query(
        'SELECT project_id FROM projects WHERE project_id = ?',
        [project_id]
      );
      if (projRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Project with ID ${project_id} does not exist`
        });
      }
      updates.push('project_id = ?');
      values.push(project_id);
    }

    if (assigned_employee_id !== undefined) {
      if (assigned_employee_id !== null) {
        if (isNaN(Number(assigned_employee_id))) {
          return res.status(400).json({
            success: false,
            message: 'Invalid assigned_employee_id format'
          });
        }
        const [empRows] = await db.query(
          'SELECT employee_id FROM employees WHERE employee_id = ?',
          [assigned_employee_id]
        );
        if (empRows.length === 0) {
          return res.status(400).json({
            success: false,
            message: `Employee with ID ${assigned_employee_id} does not exist`
          });
        }
      }
      updates.push('assigned_employee_id = ?');
      values.push(assigned_employee_id || null);
    }

    if (title) {
      updates.push('title = ?');
      values.push(title.trim());
    }

    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description ? description.trim() : null);
    }

    if (priority) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`
        });
      }
      updates.push('priority = ?');
      values.push(priority);
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
        });
      }
      updates.push('status = ?');
      values.push(status);
    }

    if (due_date !== undefined) {
      if (due_date !== null) {
        if (!isValidDate(due_date)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid due_date format. Must be YYYY-MM-DD'
          });
        }
      }
      updates.push('due_date = ?');
      values.push(due_date || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided to update'
      });
    }

    values.push(id);

    await db.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE task_id = ?`,
      values
    );

    const [updatedTask] = await db.query(
      `SELECT 
        t.task_id, 
        t.project_id, 
        t.assigned_employee_id, 
        t.title, 
        t.description, 
        t.priority, 
        t.status, 
        t.due_date,
        t.created_at, 
        t.updated_at,
        p.name AS project_name,
        e.first_name AS employee_first_name,
        e.last_name AS employee_last_name
       FROM tasks t
       JOIN projects p ON t.project_id = p.project_id
       LEFT JOIN employees e ON t.assigned_employee_id = e.employee_id
       WHERE t.task_id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask[0]
    });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({
        success: false,
        message: 'Invalid project_id or assigned_employee_id referenced'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message
    });
  }
};

// DELETE /api/tasks/:id - Delete task
exports.deleteTask = async (req, res) => {
  const { id } = req.params;

  if (isNaN(Number(id))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid task ID parameter'
    });
  }

  try {
    const [result] = await db.query(
      `DELETE FROM tasks WHERE task_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: `Task with ID ${id} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message
    });
  }
};
