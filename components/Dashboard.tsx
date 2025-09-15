
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AggregatedSkillData, CalculatedGap, DepartmentSkillGap } from '../types';
import { LightBulbIcon, ChartBarIcon, ChartPieIcon, TableCellsIcon, InformationCircleIcon } from './common/Icons';

interface DashboardProps {
  data: {
    barChartData: AggregatedSkillData[];
    pieChartData: { name: string; value: number }[];
    departmentHeatmapData: DepartmentSkillGap[];
  };
  calculatedGaps: CalculatedGap[];
  aiSummary?: string;
}

const BRAND_PIE_COLORS = ['#004040', '#FFDF00', '#006666', '#eec900']; // Teal, Golden, Lighter Teal, Darker Golden

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow-lg">
        <p className="label font-semibold text-secondary-700">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};


const Dashboard: React.FC<DashboardProps> = ({ data, calculatedGaps, aiSummary }) => {
  const { barChartData, pieChartData, departmentHeatmapData } = data;

  const topGapsForBarChart = barChartData
    .filter(d => d.deficientCount > 0 || d.missingCount > 0)
    .sort((a,b) => (b.deficientCount + b.missingCount) - (a.deficientCount + a.missingCount))
    .slice(0, 10);

  const uniqueDepartments = [...new Set(departmentHeatmapData.map(d => d.department))];
  const uniqueSkillsInHeatmap = [...new Set(departmentHeatmapData.map(d => d.skill))].slice(0,10); 


  const getHeatmapColor = (gaps: number) => {
    if (gaps === 0) return 'bg-green-100'; // Keep standard indication colors for heatmap
    if (gaps <= 2) return 'bg-yellow-200';
    if (gaps <= 5) return 'bg-orange-300';
    return 'bg-red-400 text-white';
  };
  
  if (!calculatedGaps || calculatedGaps.length === 0) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <InformationCircleIcon className="h-12 w-12 text-secondary-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-secondary-700">No Data Processed</h3>
        <p className="text-gray-500 mt-2">Please upload and process skill data to view the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {aiSummary && (
        <div className="bg-primary-50 border-l-4 border-primary-500 text-secondary-700 p-4 rounded-md shadow"> {/* Golden themed box */}
          <div className="flex">
            <div className="py-1"><LightBulbIcon className="h-6 w-6 text-primary-600 mr-3" /></div>
            <div>
              <p className="font-bold text-secondary-800">AI Summary</p>
              <p className="text-sm">{aiSummary}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-secondary-700 mb-4 flex items-center"><ChartBarIcon className="h-5 w-5 mr-2 text-secondary-600"/>Top 10 Skill Gaps (Deficient or Missing)</h3>
          {topGapsForBarChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topGapsForBarChart} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="skill" type="category" width={100} interval={0} tick={{ fontSize: 12 }}/>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="deficientCount" name="Deficient" stackId="a" fill={BRAND_PIE_COLORS[1]} /> {/* Golden */}
                <Bar dataKey="missingCount" name="Missing" stackId="a" fill={BRAND_PIE_COLORS[3]} /> {/* Darker Golden or another contrasting color */}
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-center py-10">No significant skill gaps to display.</p>}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-secondary-700 mb-4 flex items-center"><ChartPieIcon className="h-5 w-5 mr-2 text-secondary-600"/>Workforce Skill Compliance</h3>
           {(pieChartData.find(d => d.name === "Compliant")?.value === 0 && pieChartData.find(d => d.name === "Non-Compliant")?.value === 0 && pieChartData.length === 2 ) || pieChartData.find(d=> d.name === "No Data") ? (
             <p className="text-gray-500 text-center py-10">Compliance data not available.</p>
           ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Compliant' ? BRAND_PIE_COLORS[0] : BRAND_PIE_COLORS[1]} /> /* Teal for Compliant, Golden for Non-Compliant */
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />}/>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
           )}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-secondary-700 mb-4 flex items-center"><TableCellsIcon className="h-5 w-5 mr-2 text-secondary-600"/>Skill Gaps by Department (Top 10 Skills)</h3>
        {departmentHeatmapData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">Department</th>
                  {uniqueSkillsInHeatmap.map(skill => (
                    <th key={skill} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{skill}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uniqueDepartments.map(dept => (
                  <tr key={dept}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-secondary-900 sticky left-0 bg-white z-10">{dept}</td>
                    {uniqueSkillsInHeatmap.map(skill => {
                      const gapEntry = departmentHeatmapData.find(d => d.department === dept && d.skill === skill);
                      const gaps = gapEntry ? gapEntry.gaps : 0;
                      return (
                        <td key={`${dept}-${skill}`} className={`px-4 py-3 whitespace-nowrap text-sm text-center ${getHeatmapColor(gaps)}`}>
                          {gaps > 0 ? gaps : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-gray-500 text-center py-10">No department-specific gap data to display.</p>}
        <div className="mt-4 text-xs text-gray-500">
            Color intensity indicates number of employees with gaps:
            <span className="inline-block w-3 h-3 bg-green-100 ml-2 mr-1"></span> None
            <span className="inline-block w-3 h-3 bg-yellow-200 ml-2 mr-1"></span> Low (1-2)
            <span className="inline-block w-3 h-3 bg-orange-300 ml-2 mr-1"></span> Medium (3-5)
            <span className="inline-block w-3 h-3 bg-red-400 ml-2 mr-1"></span> High (&gt;5)
        </div>
      </div>
    </div>
  );
};

export default Dashboard;