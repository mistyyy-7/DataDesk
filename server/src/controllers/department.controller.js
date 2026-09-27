const db = require('../config/db.config');

// GET /api/departments - Get all departments
exports.getAllDepartments = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT department_id, name, code, location, created_at, updated_at 
       FROM departments 
       ORDER BY name ASC`
    );
    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message
    });
  }
};

// GET /api/departments/:id - Get single department by ID
exports.getDepartmentById = async (req, res) => {
  const { id } = req.params;

  if (isNaN(Number(id))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid department ID parameter'
    });
  }

  try {
    const [rows] = await db.query(
      `SELECT department_id, name, code, location, created_at, updated_at 
       FROM departments 
       WHERE department_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Department with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department',
      error: error.message
    });
  }
};

// POST /api/departments - Create new department
exports.createDepartment = async (req, res) => {
  const { name, code, location } = req.body;

  if (!name || !code) {
    return res.status(400).json({
      success: false,
      message: 'Department name and code are required'
    });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO departments (name, code, location) VALUES (?, ?, ?)`,
      [name.trim(), code.trim(), location ? location.trim() : null]
    );

    const [newDepartment] = await db.query(
      `SELECT department_id, name, code, location, created_at, updated_at 
       FROM departments 
       WHERE department_id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: newDepartment[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Department with this name or code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create department',
      error: error.message
    });
  }
};

// PUT /api/departments/:id - Update existing department
exports.updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name, code, location } = req.body;

  if (isNaN(Number(id))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid department ID parameter'
    });
  }

  if (!name && !code && location === undefined) {
    return res.status(400).json({
      success: false,
      message: 'At least one field (name, code, or location) must be provided for update'
    });
  }

  try {
    const [existing] = await db.query(
      `SELECT department_id FROM departments WHERE department_id = ?`,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Department with ID ${id} not found`
      });
    }

    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (code) {
      updates.push('code = ?');
      values.push(code.trim());
    }
    if (location !== undefined) {
      updates.push('location = ?');
      values.push(location ? location.trim() : null);
    }

    values.push(id);

    await db.query(
      `UPDATE departments SET ${updates.join(', ')} WHERE department_id = ?`,
      values
    );

    const [updatedDepartment] = await db.query(
      `SELECT department_id, name, code, location, created_at, updated_at 
       FROM departments 
       WHERE department_id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: updatedDepartment[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Department with this name or code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update department',
      error: error.message
    });
  }
};

// DELETE /api/departments/:id - Delete department
exports.deleteDepartment = async (req, res) => {
  const { id } = req.params;

  if (isNaN(Number(id))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid department ID parameter'
    });
  }

  try {
    const [result] = await db.query(
      `DELETE FROM departments WHERE department_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `Department with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: `Department with ID ${id} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete department',
      error: error.message
    });
  }
};
