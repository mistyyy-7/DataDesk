const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

router.get('/department-summary', analyticsController.getDepartmentSummary);
router.get('/project-summary', analyticsController.getProjectSummary);
router.get('/employee-workload', analyticsController.getEmployeeWorkload);
router.get('/project-status', analyticsController.getProjectStatusSummary);
router.get('/salary-ranking', analyticsController.getSalaryRanking);

module.exports = router;
