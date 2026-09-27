const express = require('express');
const router = express.Router();
const projectMemberController = require('../controllers/projectMember.controller');

router.get('/', projectMemberController.getAllProjectMembers);
router.get('/:projectId/:employeeId', projectMemberController.getProjectMemberByIds);
router.post('/', projectMemberController.createProjectMember);
router.put('/:projectId/:employeeId', projectMemberController.updateProjectMember);
router.delete('/:projectId/:employeeId', projectMemberController.deleteProjectMember);

module.exports = router;
