import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Database, 
  BarChart3, 
  Settings, 
  Activity, 
  Server, 
  HardDrive,
  Users,
  Briefcase,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface DepartmentSummary {
  department_id: number;
  department_name: string;
  department_code: string;
  employee_count: number;
  average_salary: number | string;
}

interface ProjectSummary {
  project_id: number;
  project_name: string;
  project_code: string;
  status: string;
  employee_count: number;
  task_count: number;
  allocated_budget: number | string;
  spent_budget: number | string;
  budget_utilization_percentage: number | string;
}

interface EmployeeWorkload {
  employee_id: number;
  first_name: string;
  last_name: string;
  email: string;
  department_name: string | null;
  assigned_task_count: number;
  completed_task_count: number;
  pending_task_count: number;
}

interface ProjectStatusSummary {
  status: string;
  project_count: number;
}

interface SalaryRanking {
  employee_id: number;
  first_name: string;
  last_name: string;
  job_title: string;
  salary: number | string;
  department_name: string | null;
  salary_rank_in_department: number;
}

const STATUS_COLORS: Record<string, string> = {
  planning: '#6366f1',
  in_progress: '#3b82f6',
  on_hold: '#f59e0b',
  completed: '#10b981',
  cancelled: '#ef4444',
};

export function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [departmentSummary, setDepartmentSummary] = useState<DepartmentSummary[]>([]);
  const [projectSummary, setProjectSummary] = useState<ProjectSummary[]>([]);
  const [employeeWorkload, setEmployeeWorkload] = useState<EmployeeWorkload[]>([]);
  const [projectStatus, setProjectStatus] = useState<ProjectStatusSummary[]>([]);
  const [salaryRanking, setSalaryRanking] = useState<SalaryRanking[]>([]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [deptRes, projRes, workRes, statusRes, rankRes] = await Promise.all([
        fetch('http://localhost:5000/api/analytics/department-summary'),
        fetch('http://localhost:5000/api/analytics/project-summary'),
        fetch('http://localhost:5000/api/analytics/employee-workload'),
        fetch('http://localhost:5000/api/analytics/project-status'),
        fetch('http://localhost:5000/api/analytics/salary-ranking'),
      ]);

      if (!deptRes.ok || !projRes.ok || !workRes.ok || !statusRes.ok || !rankRes.ok) {
        throw new Error('One or more analytics API requests failed');
      }

      const [deptData, projData, workData, statusData, rankData] = await Promise.all([
        deptRes.json(),
        projRes.json(),
        workRes.json(),
        statusRes.json(),
        rankRes.json(),
      ]);

      setDepartmentSummary(deptData.data || []);
      setProjectSummary(projData.data || []);
      setEmployeeWorkload(workData.data || []);
      setProjectStatus(statusData.data || []);
      setSalaryRanking(rankData.data || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while connecting to the analytics API');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Brand Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-none">DataDesk</h1>
              <span className="text-xs text-slate-400 font-medium">Relational Analytics</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
            <a 
              href="#dashboard" 
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-white bg-indigo-600/10 text-indigo-400 rounded-md border border-indigo-500/20"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </a>
            <a 
              href="#analytics" 
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-md transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </a>
            <a 
              href="#database" 
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-md transition-colors"
            >
              <HardDrive className="w-4 h-4" />
              Database Schemas
            </a>
            <a 
              href="#settings" 
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-md transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </a>
          </nav>
        </div>

        {/* System Status Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 bg-slate-900/80 rounded-lg border border-slate-800">
            <div className="relative">
              <Server className={`w-4 h-4 ${error ? 'text-rose-400' : 'text-emerald-400'}`} />
              <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${error ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`}></span>
            </div>
            <div className="text-xs overflow-hidden">
              <p className="font-medium text-slate-300">Backend API</p>
              <p className="text-slate-500 truncate">{error ? 'Disconnected' : 'Connected (GET /api/analytics)'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
              Analytics Overview
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchAnalyticsData}
              disabled={loading}
              className="flex items-center gap-2 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>Environment: Development</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-900">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center p-16 border border-slate-800 rounded-xl bg-slate-950/40">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                <p className="text-slate-300 text-sm font-medium">Fetching real-time database analytics...</p>
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="border border-rose-500/20 bg-rose-500/10 rounded-xl p-6 flex items-start gap-4 text-rose-300">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <h3 className="font-semibold text-sm">Failed to Load Analytics Data</h3>
                  <p className="text-xs text-rose-400/80 mt-1">{error}</p>
                  <button 
                    onClick={fetchAnalyticsData}
                    className="mt-3 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 px-3 py-1.5 rounded border border-rose-500/30 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Data Rendered State */}
            {!loading && !error && (
              <>
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Total Departments</span>
                      <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-100 mt-2">{departmentSummary.length}</p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Total Projects</span>
                      <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                        <Briefcase className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-100 mt-2">{projectSummary.length}</p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Active Employees</span>
                      <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-100 mt-2">{employeeWorkload.length}</p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Total Budget Allocated</span>
                      <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                        <DollarSign className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-100 mt-2">
                      ${projectSummary.reduce((acc, curr) => acc + Number(curr.allocated_budget || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Department Employee & Salary Summary Chart */}
                  <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-slate-200 mb-1">Department Headcount & Average Salary</h3>
                    <p className="text-xs text-slate-400 mb-6">Aggregated via MySQL JOIN & GROUP BY</p>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={departmentSummary}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="department_name" stroke="#94a3b8" fontSize={12} />
                          <YAxis stroke="#94a3b8" fontSize={12} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                          />
                          <Bar dataKey="employee_count" name="Employees" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Project Status Pie Chart */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200 mb-1">Project Status Distribution</h3>
                      <p className="text-xs text-slate-400 mb-4">Breakdown by project status</p>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={projectStatus}
                              dataKey="project_count"
                              nameKey="status"
                              cx="50%"
                              cy="50%"
                              outerRadius={70}
                              label={({ name }) => name}
                            >
                              {projectStatus.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#8884d8'} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="space-y-1 mt-4">
                      {projectStatus.map((item) => (
                        <div key={item.status} className="flex items-center justify-between text-xs">
                          <span className="capitalize text-slate-400">{item.status.replace('_', ' ')}</span>
                          <span className="font-semibold text-slate-200">{item.project_count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Salary Ranking Window Function Table */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-slate-200 mb-1">Employee Salary Rankings by Department</h3>
                  <p className="text-xs text-slate-400 mb-4">Calculated using MySQL RANK() OVER (PARTITION BY department_id ORDER BY salary DESC)</p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                        <tr>
                          <th className="px-4 py-3">Rank</th>
                          <th className="px-4 py-3">Employee</th>
                          <th className="px-4 py-3">Department</th>
                          <th className="px-4 py-3">Job Title</th>
                          <th className="px-4 py-3 text-right">Salary</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {salaryRanking.map((emp) => (
                          <tr key={emp.employee_id} className="hover:bg-slate-900/50">
                            <td className="px-4 py-3 font-semibold text-indigo-400">#{emp.salary_rank_in_department}</td>
                            <td className="px-4 py-3 font-medium text-slate-100">{emp.first_name} {emp.last_name}</td>
                            <td className="px-4 py-3 text-slate-400">{emp.department_name || 'N/A'}</td>
                            <td className="px-4 py-3 text-slate-400">{emp.job_title}</td>
                            <td className="px-4 py-3 text-right font-mono text-emerald-400">${Number(emp.salary).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
