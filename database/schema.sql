-- DataDesk Relational Database Schema
-- Database Target: MySQL 8.0+

CREATE DATABASE IF NOT EXISTS datadesk_db;
USE datadesk_db;

-- Drop tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS budgets;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS project_members;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS departments;

-- -----------------------------------------------------------------------------
-- 1. DEPARTMENTS
-- Represents organization departments responsible for grouping employees and budgets
-- -----------------------------------------------------------------------------
CREATE TABLE departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    location VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. EMPLOYEES
-- Represents staff members belonging to a single department (1:N relationship)
-- -----------------------------------------------------------------------------
CREATE TABLE employees (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    job_title VARCHAR(100) NOT NULL,
    salary DECIMAL(12, 2) NOT NULL CHECK (salary >= 0),
    hire_date DATE NOT NULL,
    status ENUM('active', 'on_leave', 'terminated') NOT NULL DEFAULT 'active',
    department_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_employees_department
        FOREIGN KEY (department_id) 
        REFERENCES departments(department_id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. PROJECTS
-- Represents company initiatives and software projects
-- -----------------------------------------------------------------------------
CREATE TABLE projects (
    project_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    description TEXT,
    status ENUM('planning', 'in_progress', 'on_hold', 'completed', 'cancelled') NOT NULL DEFAULT 'planning',
    start_date DATE NOT NULL,
    end_date DATE,
    department_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_project_dates CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT fk_projects_department
        FOREIGN KEY (department_id) 
        REFERENCES departments(department_id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. PROJECT_MEMBERS
-- Junction table representing M:N relationship between Projects and Employees
-- -----------------------------------------------------------------------------
CREATE TABLE project_members (
    project_id INT NOT NULL,
    employee_id INT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Member',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, employee_id),
    CONSTRAINT fk_project_members_project
        FOREIGN KEY (project_id) 
        REFERENCES projects(project_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_project_members_employee
        FOREIGN KEY (employee_id) 
        REFERENCES employees(employee_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. TASKS
-- Represents work items associated with a project (1:N) and optionally assigned to an employee
-- -----------------------------------------------------------------------------
CREATE TABLE tasks (
    task_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    assigned_employee_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    status ENUM('todo', 'in_progress', 'review', 'done') NOT NULL DEFAULT 'todo',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tasks_project
        FOREIGN KEY (project_id) 
        REFERENCES projects(project_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_tasks_employee
        FOREIGN KEY (assigned_employee_id) 
        REFERENCES employees(employee_id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. BUDGETS
-- Represents financial allocations and expenditures for projects (1:N)
-- -----------------------------------------------------------------------------
CREATE TABLE budgets (
    budget_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    fiscal_year INT NOT NULL CHECK (fiscal_year >= 2000 AND fiscal_year <= 2100),
    allocated_amount DECIMAL(14, 2) NOT NULL CHECK (allocated_amount >= 0),
    spent_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00 CHECK (spent_amount >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_project_fiscal_year UNIQUE (project_id, fiscal_year),
    CONSTRAINT fk_budgets_project
        FOREIGN KEY (project_id) 
        REFERENCES projects(project_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- INDEXES FOR QUERY OPTIMIZATION
-- -----------------------------------------------------------------------------

-- Foreign Key Indexes
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_projects_department ON projects(department_id);
CREATE INDEX idx_project_members_employee ON project_members(employee_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_employee ON tasks(assigned_employee_id);
CREATE INDEX idx_budgets_project ON budgets(project_id);

-- Frequently Queried / Filtered Columns
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_job_title ON employees(job_title);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
