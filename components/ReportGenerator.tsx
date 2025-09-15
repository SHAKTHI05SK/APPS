
import React from 'react';
import { CalculatedGap, TrainingRecommendation, HiringSuggestion, RoleReadinessSummary, EmployeeSkill } from '../types';
import { DownloadIcon, DocumentReportIcon, InformationCircleIcon } from './common/Icons';

interface ReportGeneratorProps {
  gaps: CalculatedGap[];
  trainingRecs: TrainingRecommendation[];
  hiringRecs: HiringSuggestion[];
  roleReadiness: RoleReadinessSummary[];
  employeeSkills: EmployeeSkill[];
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ gaps, trainingRecs, hiringRecs, roleReadiness, employeeSkills }) => {

  const convertToCSV = <T extends object,>(data: T[], headersInput?: (keyof T)[]): string => {
    if (!data || data.length === 0) return '';
    const headers = headersInput || Object.keys(data[0]) as (keyof T)[];
    const csvRows = [
      headers.join(','), 
      ...data.map(row =>
        headers.map(fieldName => {
            let cellValue = row[fieldName];
            if (Array.isArray(cellValue)) {
                cellValue = cellValue.join('; ') as any; 
            } else if (typeof cellValue === 'object' && cellValue !== null) {
                cellValue = JSON.stringify(cellValue) as any;
            }
            const stringValue = String(cellValue === null || cellValue === undefined ? '' : cellValue);
            return `"${stringValue.replace(/"/g, '""')}"`; 
        }).join(',')
      )
    ];
    return csvRows.join('\r\n');
  };

  const downloadCSV = (csvString: string, filename: string) => {
    if (!csvString) {
      alert("No data available to download for this report.");
      return;
    }
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const majorGaps = gaps.filter(g => g.gap_type === 'missing' || (g.gap_type === 'deficient' && g.gap && g.gap >= 2));
  
  const employeeGapReportData = majorGaps.map(g => ({
    Employee_ID: g.employee_id,
    Employee_Name: g.employee_name,
    Department: g.department,
    Role: g.role,
    Skill_Missing_Or_Deficient: g.skill,
    Current_Level: g.current_level === null ? 'N/A (Missing)' : g.current_level,
    Required_Level: g.required_level,
    Gap_Severity: g.gap === null ? 'N/A' : g.gap,
    Gap_Type: g.gap_type
  }));

  const trainingRecsReportData = trainingRecs.map(tr => ({
    Employee_ID: tr.employee_id,
    Employee_Name: tr.name,
    Role: tr.role,
    Training_Suggestions: tr.suggestions.join('; ')
  }));
  
  const roleReadinessReportData = roleReadiness.map(rr => ({
    Role: rr.role,
    Readiness_Summary: rr.readiness_summary
  }));

  const hiringRecsReportData = hiringRecs.map(hr => ({
    Role_Needing_Hiring: hr.role,
    Hiring_Suggestion_Reason: hr.hiring_suggestion,
    Ideal_Candidate_Keywords: hr.profile_keywords.join('; ')
  }));

  const reports = [
    { name: 'Employees with Major Skill Gaps', data: employeeGapReportData, generator: () => convertToCSV(employeeGapReportData) },
    { name: 'Training Recommendations (AI)', data: trainingRecsReportData, generator: () => convertToCSV(trainingRecsReportData) },
    { name: 'Role Readiness Summary (AI)', data: roleReadinessReportData, generator: () => convertToCSV(roleReadinessReportData) },
    { name: 'Hiring Needs (AI)', data: hiringRecsReportData, generator: () => convertToCSV(hiringRecsReportData) },
    { name: 'All Calculated Skill Gaps', data: gaps, generator: () => convertToCSV(gaps.map(g=> ({...g, current_level: g.current_level ?? 'N/A'}))) },
    { name: 'Original Employee Skills Data', data: employeeSkills, generator: () => convertToCSV(employeeSkills) },
  ];
  
  if (gaps.length === 0 && employeeSkills.length === 0) {
     return (
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <InformationCircleIcon className="h-12 w-12 text-secondary-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-secondary-700">No Data for Reports</h3>
        <p className="text-gray-500 mt-2">Please upload and process skill data to generate reports.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-secondary-800 mb-6 flex items-center">
        <DocumentReportIcon className="h-6 w-6 mr-2 text-secondary-600" />
        Exportable Reports
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="font-medium text-secondary-700">{report.name}</h3>
            <p className="text-xs text-gray-500 mb-3">
              {report.data && report.data.length > 0 ? `${report.data.length} entries` : 'No data available'}
            </p>
            <button
              onClick={() => downloadCSV(report.generator(), `${report.name.toLowerCase().replace(/\s+/g, '_')}_report.csv`)}
              disabled={!report.data || report.data.length === 0}
              className="w-full flex items-center justify-center text-sm bg-secondary-600 hover:bg-secondary-700 text-white font-medium py-2 px-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              Download CSV
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportGenerator;