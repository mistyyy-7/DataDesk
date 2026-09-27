const db = require('../config/db.config');

const VALID_STATUSES = ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'];

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

// GET /api/projects - Get all projects with department name
exports.getAllProjects = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        p.project_id, 
        p.name, 
        p.code, 
        p.description, 
        p.status, 
        p.start_date, 
        p.end_date, 
        p.department_id,
        d.name AS department_name,
        p.created_at, 
        p.updated_at
       FROM projects p
       LEFT JOIN departments d ON p.department_id = d.department_id
       ORDER BY p.project_id DESC`
    );
    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message
    });
  }
};

// GET /api/projects/:id - Get single project by ID with department name
exports.getProjectById = async (req, res) => {
  const { id } = req.params;

  if (isNaN(Number(id))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid project ID parameter'
    });
  }

  try {
    const [rows] = await db.query(
      `SELECT 
        p.project_id, 
        p.name, 
        p.code, 
        p.description, 
        p.status, 
        p.start_date, 
        p.end_date, 
        p.department_id,
        d.name AS department_name,
        p.created_at, 
        p.updated_at
       FROM projects p
       LEFT JOIN departments d ON p.department_id = d.department_id
       WHERE p.project_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Project with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: error.message
    });
  }
};

// POST /api/projects - Create new project
exports.createProject = async (req, res) => {
  const { 
    name, 
    code, 
    description, 
    status, 
    start_date, 
    end_date, 
    department_id 
  } = req.body;

  // Validate required fields
  if (!name || !code || !start_date) {
    return res.status(400).json({
      success: false,
      message: 'Missing required project fields: name, code, start_date'
    });
  }

  // Validate dates
  if (!isValidDate(start_date)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid start_date format. Must be YYYY-MM-DD'
    });
  }

  if (end_date) {
    if (!isValidDate(end_date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid end_date format. Must be YYYY-MM-DD'
      });
    }
    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({
        success: false,
        message: 'end_date cannot be earlier than start_date'
      });
    }
  }

  // Validate status
  const projectStatus = status || 'planning';
  if (!VALID_STATUSES.includes(projectStatus)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
    });
  }

  try {
    // Validate department_id if provided
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
      `INSERT INTO projects 
       (name, code, description, status, start_date, end_date, department_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        code.trim().toUpperCase(),
        description ? description.trim() : null,
        projectStatus,
        start_date,
        end_date || null,
        department_id || null
      ]
    );

    const [newProject] = await db.query(
      `SELECT 
        p.project_id, 
        p.name, 
        p.code, 
        p.description, 
        p.status, 
        p.start_date, 
        p.end_date, 
        p.department_id,
        d.name AS department_name,
        p.created_at, 
        p.updated_at
       FROM projects p
       LEFT JOIN departments d ON p.department_id = d.department_id
       WHERE p.project_id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: newProject[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Project with this code already exists'
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
      message: 'Failed to create project',
      error: error.message
    });
  }
};

// PUT /api/projects/:id - Update existing project
exports.updateProject = async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    code, 
    description, 
    status, 
    start_date, 
    end_date, 
    department_id 
  } = req.body;

  if (isNaN(Number(id))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid project ID parameter'
    });
  }

  try {
    const [existingRows] = await db.query(
      `SELECT project_id, start_date, end_date FROM projects WHERE project_id = ?`,
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Project with ID ${id} not found`
      });
    }

    const currentProject = existingRows[0];
    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (code) {
      updates.push('code = ?');
      values.push(code.trim().toUpperCase());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description ? description.trim() : null);
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

    // Date validations
    let newStartDate = currentProject.start_date;
    let newEndDate = currentProject.end_date;

    if (start_date) {
      if (!isValidDate(start_date)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid start_date format. Must be YYYY-MM-DD'
        });
      }
      newStartDate = start_date;
      updates.push('start_date = ?');
      values.push(start_date);
    }

    if (end_date !== undefined) {
      if (end_date !== null) {
        if (!isValidDate(end_date)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid end_date format. Must be YYYY-MM-DD'
          });
        }
        newEndDate = end_date;
      } else {
        newEndDate = null;
      }
      updates.push('end_date = ?');
      values.push(end_date);
    }

    if (newEndDate && new Date(newEndDate) < new Date(newStartDate)) {
      return res.status(400).json({
        success: false,
        message: 'end_date cannot be earlier than start_date'
      });
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
      `UPDATE projects SET ${updates.join(', ')} WHERE project_id = ?`,
      values
    );

    const [updatedProject] = await db.query(
      `SELECT 
        p.project_id, 
        p.name, 
        p.code, 
        p.description, 
        p.status, 
        p.start_date, 
        p.end_date, 
        p.department_id,
        d.name AS department_name,
        p.created_at, 
        p.updated_at
       FROM projects p
       LEFT JOIN departments d ON p.department_id = d.department_id
       WHERE p.project_id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Project with this code already exists'
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
      message: 'Failed to update project',
      error: error.message
    });
  }
};

// DELETE /api/projects/:id - Delete project
exports.deleteProject = async (req, res) => {
  const { id } = req.params;

  if (isNaN(Number(id))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid project ID parameter'
    });
  }

  try {
    const [result] = await db.query(
      `DELETE FROM projects WHERE project_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `Project with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: `Project with ID ${id} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message
    });
  }
};
