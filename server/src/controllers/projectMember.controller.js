const db = require('../config/db.config');

// GET /api/project-members - Get all project members with joined project and employee details
exports.getAllProjectMembers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        pm.project_id, 
        pm.employee_id, 
        pm.role, 
        pm.assigned_at,
        p.name AS project_name,
        e.first_name AS employee_first_name,
        e.last_name AS employee_last_name,
        e.email AS employee_email
       FROM project_members pm
       JOIN projects p ON pm.project_id = p.project_id
       JOIN employees e ON pm.employee_id = e.employee_id
       ORDER BY pm.project_id DESC, pm.assigned_at DESC`
    );
    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project members',
      error: error.message
    });
  }
};

// GET /api/project-members/:projectId/:employeeId - Get single project member by composite keys
exports.getProjectMemberByIds = async (req, res) => {
  const { projectId, employeeId } = req.params;

  if (isNaN(Number(projectId)) || isNaN(Number(employeeId))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid projectId or employeeId parameter'
    });
  }

  try {
    const [rows] = await db.query(
      `SELECT 
        pm.project_id, 
        pm.employee_id, 
        pm.role, 
        pm.assigned_at,
        p.name AS project_name,
        e.first_name AS employee_first_name,
        e.last_name AS employee_last_name,
        e.email AS employee_email
       FROM project_members pm
       JOIN projects p ON pm.project_id = p.project_id
       JOIN employees e ON pm.employee_id = e.employee_id
       WHERE pm.project_id = ? AND pm.employee_id = ?`,
      [projectId, employeeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Project member record with project_id ${projectId} and employee_id ${employeeId} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project member',
      error: error.message
    });
  }
};

// POST /api/project-members - Assign employee to project
exports.createProjectMember = async (req, res) => {
  const { project_id, employee_id, role } = req.body;

  if (!project_id || !employee_id) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: project_id and employee_id'
    });
  }

  if (isNaN(Number(project_id)) || isNaN(Number(employee_id))) {
    return res.status(400).json({
      success: false,
      message: 'project_id and employee_id must be valid numbers'
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

    // Validate employee existence
    const [empRows] = await db.query(
      'SELECT employee_id FROM employees WHERE employee_id = ?',
      [employee_id]
    );
    if (empRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Employee with ID ${employee_id} does not exist`
      });
    }

    const memberRole = role ? role.trim() : 'Member';

    await db.query(
      `INSERT INTO project_members (project_id, employee_id, role) 
       VALUES (?, ?, ?)`,
      [project_id, employee_id, memberRole]
    );

    const [newMember] = await db.query(
      `SELECT 
        pm.project_id, 
        pm.employee_id, 
        pm.role, 
        pm.assigned_at,
        p.name AS project_name,
        e.first_name AS employee_first_name,
        e.last_name AS employee_last_name,
        e.email AS employee_email
       FROM project_members pm
       JOIN projects p ON pm.project_id = p.project_id
       JOIN employees e ON pm.employee_id = e.employee_id
       WHERE pm.project_id = ? AND pm.employee_id = ?`,
      [project_id, employee_id]
    );

    res.status(201).json({
      success: true,
      message: 'Employee assigned to project successfully',
      data: newMember[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: `Employee ${employee_id} is already assigned to project ${project_id}`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to assign project member',
      error: error.message
    });
  }
};

// PUT /api/project-members/:projectId/:employeeId - Update project member role
exports.updateProjectMember = async (req, res) => {
  const { projectId, employeeId } = req.params;
  const { role } = req.body;

  if (isNaN(Number(projectId)) || isNaN(Number(employeeId))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid projectId or employeeId parameter'
    });
  }

  if (!role || !role.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Role is required for update'
    });
  }

  try {
    const [existing] = await db.query(
      `SELECT project_id FROM project_members WHERE project_id = ? AND employee_id = ?`,
      [projectId, employeeId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Project member record with project_id ${projectId} and employee_id ${employeeId} not found`
      });
    }

    await db.query(
      `UPDATE project_members SET role = ? WHERE project_id = ? AND employee_id = ?`,
      [role.trim(), projectId, employeeId]
    );

    const [updatedMember] = await db.query(
      `SELECT 
        pm.project_id, 
        pm.employee_id, 
        pm.role, 
        pm.assigned_at,
        p.name AS project_name,
        e.first_name AS employee_first_name,
        e.last_name AS employee_last_name,
        e.email AS employee_email
       FROM project_members pm
       JOIN projects p ON pm.project_id = p.project_id
       JOIN employees e ON pm.employee_id = e.employee_id
       WHERE pm.project_id = ? AND pm.employee_id = ?`,
      [projectId, employeeId]
    );

    res.status(200).json({
      success: true,
      message: 'Project member role updated successfully',
      data: updatedMember[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update project member role',
      error: error.message
    });
  }
};

// DELETE /api/project-members/:projectId/:employeeId - Remove employee from project
exports.deleteProjectMember = async (req, res) => {
  const { projectId, employeeId } = req.params;

  if (isNaN(Number(projectId)) || isNaN(Number(employeeId))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid projectId or employeeId parameter'
    });
  }

  try {
    const [result] = await db.query(
      `DELETE FROM project_members WHERE project_id = ? AND employee_id = ?`,
      [projectId, employeeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `Project member assignment with project_id ${projectId} and employee_id ${employeeId} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: `Employee ${employeeId} removed from project ${projectId} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove project member',
      error: error.message
    });
  }
};
