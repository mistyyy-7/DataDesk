const db = require('../config/db.config');

// Helper to validate fiscal year
const isValidFiscalYear = (year) => {
  const numYear = Number(year);
  return !isNaN(numYear) && Number.isInteger(numYear) && numYear >= 2000 && numYear <= 2100;
};

// GET /api/budgets - Get all budgets with joined project name
exports.getAllBudgets = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        b.budget_id, 
        b.project_id, 
        b.fiscal_year, 
        b.allocated_amount, 
        b.spent_amount, 
        b.created_at, 
        b.updated_at,
        p.name AS project_name
       FROM budgets b
       JOIN projects p ON b.project_id = p.project_id
       ORDER BY b.budget_id DESC`
    );
    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budgets',
      error: error.message
    });
  }
};

// GET /api/budgets/:id - Get single budget by ID with project name
exports.getBudgetById = async (req, res) => {
  const { id } = req.params;

  if (isNaN(Number(id))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid budget ID parameter'
    });
  }

  try {
    const [rows] = await db.query(
      `SELECT 
        b.budget_id, 
        b.project_id, 
        b.fiscal_year, 
        b.allocated_amount, 
        b.spent_amount, 
        b.created_at, 
        b.updated_at,
        p.name AS project_name
       FROM budgets b
       JOIN projects p ON b.project_id = p.project_id
       WHERE b.budget_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Budget with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget',
      error: error.message
    });
  }
};

// POST /api/budgets - Create new budget allocation
exports.createBudget = async (req, res) => {
  const { project_id, fiscal_year, allocated_amount, spent_amount } = req.body;

  if (!project_id || fiscal_year === undefined || allocated_amount === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: project_id, fiscal_year, allocated_amount'
    });
  }

  if (isNaN(Number(project_id))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid project_id format'
    });
  }

  if (!isValidFiscalYear(fiscal_year)) {
    return res.status(400).json({
      success: false,
      message: 'fiscal_year must be an integer between 2000 and 2100'
    });
  }

  const numAllocated = Number(allocated_amount);
  if (isNaN(numAllocated) || numAllocated < 0) {
    return res.status(400).json({
      success: false,
      message: 'allocated_amount must be a non-negative number'
    });
  }

  const numSpent = spent_amount !== undefined ? Number(spent_amount) : 0;
  if (isNaN(numSpent) || numSpent < 0) {
    return res.status(400).json({
      success: false,
      message: 'spent_amount must be a non-negative number'
    });
  }

  if (numSpent > numAllocated) {
    return res.status(400).json({
      success: false,
      message: 'spent_amount cannot exceed allocated_amount'
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

    const [result] = await db.query(
      `INSERT INTO budgets (project_id, fiscal_year, allocated_amount, spent_amount) 
       VALUES (?, ?, ?, ?)`,
      [project_id, Number(fiscal_year), numAllocated, numSpent]
    );

    const [newBudget] = await db.query(
      `SELECT 
        b.budget_id, 
        b.project_id, 
        b.fiscal_year, 
        b.allocated_amount, 
        b.spent_amount, 
        b.created_at, 
        b.updated_at,
        p.name AS project_name
       FROM budgets b
       JOIN projects p ON b.project_id = p.project_id
       WHERE b.budget_id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Budget allocated successfully',
      data: newBudget[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: `A budget allocation for project ${project_id} in fiscal year ${fiscal_year} already exists`
      });
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({
        success: false,
        message: 'Invalid project_id referenced'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create budget',
      error: error.message
    });
  }
};

// PUT /api/budgets/:id - Update existing budget allocation
exports.updateBudget = async (req, res) => {
  const { id } = req.params;
  const { project_id, fiscal_year, allocated_amount, spent_amount } = req.body;

  if (isNaN(Number(id))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid budget ID parameter'
    });
  }

  try {
    const [existing] = await db.query(
      `SELECT budget_id, project_id, fiscal_year, allocated_amount, spent_amount 
       FROM budgets WHERE budget_id = ?`,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Budget with ID ${id} not found`
      });
    }

    const currentBudget = existing[0];
    const updates = [];
    const values = [];

    let targetProjectId = currentBudget.project_id;
    let targetFiscalYear = currentBudget.fiscal_year;
    let targetAllocated = Number(currentBudget.allocated_amount);
    let targetSpent = Number(currentBudget.spent_amount);

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
      targetProjectId = project_id;
      updates.push('project_id = ?');
      values.push(project_id);
    }

    if (fiscal_year !== undefined) {
      if (!isValidFiscalYear(fiscal_year)) {
        return res.status(400).json({
          success: false,
          message: 'fiscal_year must be an integer between 2000 and 2100'
        });
      }
      targetFiscalYear = Number(fiscal_year);
      updates.push('fiscal_year = ?');
      values.push(targetFiscalYear);
    }

    if (allocated_amount !== undefined) {
      const numAllocated = Number(allocated_amount);
      if (isNaN(numAllocated) || numAllocated < 0) {
        return res.status(400).json({
          success: false,
          message: 'allocated_amount must be a non-negative number'
        });
      }
      targetAllocated = numAllocated;
      updates.push('allocated_amount = ?');
      values.push(numAllocated);
    }

    if (spent_amount !== undefined) {
      const numSpent = Number(spent_amount);
      if (isNaN(numSpent) || numSpent < 0) {
        return res.status(400).json({
          success: false,
          message: 'spent_amount must be a non-negative number'
        });
      }
      targetSpent = numSpent;
      updates.push('spent_amount = ?');
      values.push(numSpent);
    }

    if (targetSpent > targetAllocated) {
      return res.status(400).json({
        success: false,
        message: 'spent_amount cannot exceed allocated_amount'
      });
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided to update'
      });
    }

    values.push(id);

    await db.query(
      `UPDATE budgets SET ${updates.join(', ')} WHERE budget_id = ?`,
      values
    );

    const [updatedBudget] = await db.query(
      `SELECT 
        b.budget_id, 
        b.project_id, 
        b.fiscal_year, 
        b.allocated_amount, 
        b.spent_amount, 
        b.created_at, 
        b.updated_at,
        p.name AS project_name
       FROM budgets b
       JOIN projects p ON b.project_id = p.project_id
       WHERE b.budget_id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: updatedBudget[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A budget allocation for this project and fiscal year already exists'
      });
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({
        success: false,
        message: 'Invalid project_id referenced'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update budget',
      error: error.message
    });
  }
};

// DELETE /api/budgets/:id - Delete budget allocation
exports.deleteBudget = async (req, res) => {
  const { id } = req.params;

  if (isNaN(Number(id))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid budget ID parameter'
    });
  }

  try {
    const [result] = await db.query(
      `DELETE FROM budgets WHERE budget_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `Budget with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: `Budget with ID ${id} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete budget',
      error: error.message
    });
  }
};
