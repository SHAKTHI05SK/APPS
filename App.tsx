
import React, { useState, useCallback, useEffect } from 'react';
import { EmployeeSkill, RoleExpectation, CalculatedGap, AISkillAnalysisResults, TabKey, TrainingRecommendation, HiringSuggestion, UpskillingPriority, RoleReadinessSummary } from './types';
import { parseCSV } from './services/csvParser';
import { analyzeSkills, aggregateSkillDataForCharts, getComplianceData, aggregateDepartmentSkillGaps } from './services/skillAnalyzer';
import { getAIInsights } from './services/geminiService';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import SuggestionsPanel from './components/SuggestionsPanel';
import ReportGenerator from './components/ReportGenerator';
import LoadingSpinner from './components/common/LoadingSpinner';
import { ErrorIcon, CheckCircleIcon, InfoIcon, UploadCloudIcon, LightBulbIcon, DocumentTextIcon, ChartPieIcon, BriefcaseIcon, LinkedInIcon, InstagramIcon, GitHubIcon, XIcon, YouTubeIcon, BlogIcon } from './components/common/Icons';

const App: React.FC = () => {
  const [employeeSkillsFile, setEmployeeSkillsFile] = useState<File | null>(null);
  const [roleExpectationsFile, setRoleExpectationsFile] = useState<File | null>(null);

  const [employeeSkills, setEmployeeSkills] = useState<EmployeeSkill[]>([]);
  const [roleExpectations, setRoleExpectations] = useState<RoleExpectation[]>([]);
  
  const [calculatedGaps, setCalculatedGaps] = useState<CalculatedGap[]>([]);
  const [aiResults, setAiResults] = useState<AISkillAnalysisResults | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<TabKey>(TabKey.UPLOAD);

  const resetState = useCallback(() => {
    setEmployeeSkillsFile(null);
    setRoleExpectationsFile(null);
    setEmployeeSkills([]);
    setRoleExpectations([]);
    setCalculatedGaps([]);
    setAiResults(null);
    setError(null);
    setCurrentTab(TabKey.UPLOAD);
  }, []);

  const handleProcessData = useCallback(async () => {
    if (!employeeSkillsFile || !roleExpectationsFile) {
      setError("Please upload both CSV files.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAiResults(null);
    setCalculatedGaps([]);

    try {
      const skillsText = await employeeSkillsFile.text();
      const rolesText = await roleExpectationsFile.text();

      const parsedSkills = parseCSV<EmployeeSkill>(skillsText, ['employee_id', 'name', 'department', 'role', 'skill', 'skill_level']);
      const parsedRoles = parseCSV<RoleExpectation>(rolesText, ['role', 'required_skill', 'required_level']);

      const typedSkills = parsedSkills.map(s => ({ ...s, skill_level: Number(s.skill_level) }));
      const typedRoles = parsedRoles.map(r => ({ ...r, required_level: Number(r.required_level) }));
      
      setEmployeeSkills(typedSkills);
      setRoleExpectations(typedRoles);

      const gaps = analyzeSkills(typedSkills, typedRoles);
      setCalculatedGaps(gaps);

      if (gaps.length > 0) {
        const insights = await getAIInsights(typedSkills, typedRoles, gaps);
        setAiResults(insights);
      } else {
         setAiResults({ overallSummary: "No significant skill gaps detected with the provided data or all employees are compliant."});
      }
      setCurrentTab(TabKey.DASHBOARD);
    } catch (e) {
      console.error("Processing error:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred during processing.");
      setAiResults(null); 
    } finally {
      setIsLoading(false);
    }
  }, [employeeSkillsFile, roleExpectationsFile]);

  const dashboardData = React.useMemo(() => {
    if (calculatedGaps.length === 0) return null;
    return {
      barChartData: aggregateSkillDataForCharts(calculatedGaps, roleExpectations),
      pieChartData: getComplianceData(calculatedGaps, employeeSkills),
      departmentHeatmapData: aggregateDepartmentSkillGaps(calculatedGaps),
    };
  }, [calculatedGaps, employeeSkills, roleExpectations]);

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex flex-col items-center justify-center h-64"><LoadingSpinner /><p className="mt-4 text-secondary-700">Analyzing skills data... This may take a moment.</p></div>;
    }

    if (error) {
      return (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md" role="alert">
          <div className="flex">
            <div className="py-1"><ErrorIcon className="h-6 w-6 text-red-500 mr-3" /></div>
            <div>
              <p className="font-bold">Error</p>
              <p>{error}</p>
              <button onClick={() => {setError(null); resetState();}} className="mt-2 text-sm text-red-600 hover:text-red-800 font-semibold">Try again</button>
            </div>
          </div>
        </div>
      );
    }
    
    switch (currentTab) {
      case TabKey.UPLOAD:
        return (
          <div className="space-y-6">
            <div className="bg-primary-50 border border-primary-200 p-6 rounded-lg shadow">
              <div className="flex items-start">
                <InfoIcon className="h-6 w-6 text-primary-600 mr-3 mt-1 flex-shrink-0"/>
                <div>
                  <h2 className="text-xl font-semibold text-secondary-800 mb-2">Welcome to AI-Driven Skills Gap Analysis</h2>
                  <p className="text-secondary-700">
                    Upload your employee skills and role requirements CSV files. This tool will detect critical skill gaps, highlight missing or underdeveloped skills, recommend training focus, and visualize gaps by team/department.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <FileUpload
                id="employee-skills-upload"
                label="Upload Employee Skills CSV"
                onFileChange={setEmployeeSkillsFile}
                fileName={employeeSkillsFile?.name}
                helpText="Columns: employee_id, name, department, role, skill, skill_level (1-5)"
              />
              <FileUpload
                id="role-expectations-upload"
                label="Upload Role Expectations CSV"
                onFileChange={setRoleExpectationsFile}
                fileName={roleExpectationsFile?.name}
                helpText="Columns: role, required_skill, required_level (1-5)"
              />
            </div>
            <button
              onClick={handleProcessData}
              disabled={!employeeSkillsFile || !roleExpectationsFile || isLoading}
              className="w-full flex items-center justify-center bg-secondary-600 hover:bg-secondary-700 text-primary-500 font-semibold py-3 px-6 rounded-lg shadow-md disabled:opacity-50 transition-colors duration-150"
            >
              <BriefcaseIcon className="h-5 w-5 mr-2"/>
              Analyze Skill Gaps
            </button>
          </div>
        );
      case TabKey.DASHBOARD:
        return dashboardData ? <Dashboard data={dashboardData} calculatedGaps={calculatedGaps} aiSummary={aiResults?.overallSummary} /> : <p className="text-center text-gray-500">No data to display. Please upload files and process them.</p>;
      case TabKey.SUGGESTIONS:
        return aiResults ? <SuggestionsPanel results={aiResults} /> : <p className="text-center text-gray-500">No AI suggestions available. Process data to generate insights.</p>;
      case TabKey.REPORTS:
        return <ReportGenerator 
                  gaps={calculatedGaps} 
                  trainingRecs={aiResults?.trainingRecommendations || []} 
                  hiringRecs={aiResults?.hiringSuggestions || []}
                  roleReadiness={aiResults?.roleReadinessSummaries || []}
                  employeeSkills={employeeSkills}
                />;
      default:
        return null;
    }
  };
  
  const TabButton: React.FC<{ tabKey: TabKey; label: string; icon: React.ReactNode }> = ({ tabKey, label, icon }) => (
    <button
      onClick={() => setCurrentTab(tabKey)}
      disabled={tabKey !== TabKey.UPLOAD && (!calculatedGaps || calculatedGaps.length === 0)}
      className={`flex items-center justify-center px-4 py-3 font-medium text-sm rounded-t-lg transition-colors duration-150
                  ${currentTab === tabKey ? 'bg-white text-secondary-600 border-b-2 border-secondary-600' : 'text-gray-600 hover:text-secondary-600 hover:bg-secondary-50'}
                  disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed`}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-secondary-50 p-4 sm:p-6 lg:p-8">
      <header className="mb-8 text-center">
        <img 
          src="https://raw.githubusercontent.com/hereandnowai/images/refs/heads/main/logos/HNAI%20Title%20-Teal%20%26%20Golden%20Logo%20-%20DESIGN%203%20-%20Raj-07.png" 
          alt="HERE AND NOW AI Logo" 
          className="h-16 sm:h-20 md:h-24 mx-auto" 
        />
        <p className="mt-2 text-lg text-secondary-600">HERE AND NOW AI - Artificial Intelligence Research Institute</p>
      </header>
      
      <main className="max-w-6xl mx-auto bg-white shadow-xl rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap -mb-px px-4 pt-2" aria-label="Tabs">
             <TabButton tabKey={TabKey.UPLOAD} label="Upload Data" icon={<UploadCloudIcon className="h-5 w-5"/>} />
             <TabButton tabKey={TabKey.DASHBOARD} label="Dashboard" icon={<ChartPieIcon className="h-5 w-5"/>} />
             <TabButton tabKey={TabKey.SUGGESTIONS} label="AI Suggestions" icon={<LightBulbIcon className="h-5 w-5"/>} />
             <TabButton tabKey={TabKey.REPORTS} label="Export Reports" icon={<DocumentTextIcon className="h-5 w-5"/>} />
          </nav>
        </div>
        <div className="p-6 md:p-8">
          {renderContent()}
        </div>
      </main>

      <footer className="mt-12 text-center text-sm text-secondary-700">
        <div className="mb-4 flex justify-center space-x-6">
          <a href="https://hereandnowai.com/blog" target="_blank" rel="noopener noreferrer" aria-label="Blog" className="text-secondary-600 hover:text-primary-500 transition-colors">
            <BlogIcon className="h-6 w-6" />
          </a>
          <a href="https://www.linkedin.com/company/hereandnowai/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-secondary-600 hover:text-primary-500 transition-colors">
            <LinkedInIcon className="h-6 w-6" />
          </a>
          <a href="https://instagram.com/hereandnow_ai" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-secondary-600 hover:text-primary-500 transition-colors">
            <InstagramIcon className="h-6 w-6" />
          </a>
          <a href="https://github.com/hereandnowai" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-secondary-600 hover:text-primary-500 transition-colors">
            <GitHubIcon className="h-6 w-6" />
          </a>
          <a href="https://x.com/hereandnow_ai" target="_blank" rel="noopener noreferrer" aria-label="X" className="text-secondary-600 hover:text-primary-500 transition-colors">
            <XIcon className="h-6 w-6" />
          </a>
          <a href="https://youtube.com/@hereandnow_ai" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-secondary-600 hover:text-primary-500 transition-colors">
            <YouTubeIcon className="h-6 w-6" />
          </a>
        </div>
        <p>&copy; {new Date().getFullYear()} HERE AND NOW AI. designed with passion for innovation.</p>
        <p>Developed by Sakthi Kannan [ AI Products Engineering Team ]</p>
      </footer>
    </div>
  );
};

export default App;
