
import { EmployeeSkill, RoleExpectation, CalculatedGap, AggregatedSkillData, DepartmentSkillGap } from '../types';

export const analyzeSkills = (employeeSkills: EmployeeSkill[], roleExpectations: RoleExpectation[]): CalculatedGap[] => {
  const gaps: CalculatedGap[] = [];
  const roleExpectationsMap = new Map<string, RoleExpectation[]>();

  roleExpectations.forEach(req => {
    if (!roleExpectationsMap.has(req.role)) {
      roleExpectationsMap.set(req.role, []);
    }
    roleExpectationsMap.get(req.role)!.push(req);
  });

  const employeeSkillsMap = new Map<string, EmployeeSkill[]>();
  employeeSkills.forEach(skill => {
    if (!employeeSkillsMap.has(skill.employee_id)) {
      employeeSkillsMap.set(skill.employee_id, []);
    }
    employeeSkillsMap.get(skill.employee_id)!.push(skill);
  });
  
  // Use a Set to track unique employees processed for role requirements
  const processedEmployeesForRoleReqs = new Set<string>();

  employeeSkills.forEach(empSkill => {
    // Ensure we process each employee only once for their role's requirements
    if (processedEmployeesForRoleReqs.has(empSkill.employee_id)) return;
    processedEmployeesForRoleReqs.add(empSkill.employee_id);

    const expectationsForRole = roleExpectationsMap.get(empSkill.role) || [];
    const currentEmployeeSkills = employeeSkillsMap.get(empSkill.employee_id) || [];

    expectationsForRole.forEach(req => {
      const actualSkill = currentEmployeeSkills.find(s => s.skill === req.required_skill);
      let gapReport: CalculatedGap;

      if (!actualSkill) {
        gapReport = {
          employee_id: empSkill.employee_id,
          employee_name: empSkill.name,
          department: empSkill.department,
          role: empSkill.role,
          skill: req.required_skill,
          current_level: null,
          required_level: req.required_level,
          gap: req.required_level,
          gap_type: 'missing',
        };
      } else {
        const levelDifference = req.required_level - actualSkill.skill_level;
        gapReport = {
          employee_id: empSkill.employee_id,
          employee_name: empSkill.name,
          department: empSkill.department,
          role: empSkill.role,
          skill: req.required_skill,
          current_level: actualSkill.skill_level,
          required_level: req.required_level,
          gap: levelDifference,
          gap_type: levelDifference > 0 ? 'deficient' : (levelDifference === 0 ? 'compliant' : 'exceeds'),
        };
      }
      gaps.push(gapReport);
    });
  });

  return gaps;
};

export const aggregateSkillDataForCharts = (
  calculatedGaps: CalculatedGap[],
  roleExpectations: RoleExpectation[]
): AggregatedSkillData[] => {
  const skillMap = new Map<string, { deficientCount: number; missingCount: number; totalGapValue: number; gapEntries: number }>();

  const allRelevantSkills = new Set<string>(roleExpectations.map(r => r.required_skill));
  calculatedGaps.forEach(gap => allRelevantSkills.add(gap.skill));


  allRelevantSkills.forEach(skillName => {
    skillMap.set(skillName, { deficientCount: 0, missingCount: 0, totalGapValue: 0, gapEntries: 0 });
  });
  
  calculatedGaps.forEach(gap => {
    const entry = skillMap.get(gap.skill);
    if (entry) {
      if (gap.gap_type === 'deficient') {
        entry.deficientCount++;
        if (gap.gap !== null) {
            entry.totalGapValue += gap.gap;
            entry.gapEntries++;
        }
      } else if (gap.gap_type === 'missing') {
        entry.missingCount++;
         if (gap.gap !== null) { // Should always be non-null for missing
            entry.totalGapValue += gap.gap;
            entry.gapEntries++;
        }
      }
    }
  });

  return Array.from(skillMap.entries()).map(([skill, data]) => ({
    skill,
    deficientCount: data.deficientCount,
    missingCount: data.missingCount,
    averageGap: data.gapEntries > 0 ? parseFloat((data.totalGapValue / data.gapEntries).toFixed(2)) : 0,
  })).sort((a, b) => (b.deficientCount + b.missingCount) - (a.deficientCount + a.missingCount)); // Sort by total gaps
};

export const getComplianceData = (
  calculatedGaps: CalculatedGap[],
  employeeSkills: EmployeeSkill[]
): { name: string; value: number }[] => {
  const uniqueEmployeeIds = new Set(employeeSkills.map(es => es.employee_id));
  let compliantEmployees = uniqueEmployeeIds.size;

  const nonCompliantEmployeeIds = new Set<string>();
  calculatedGaps.forEach(gap => {
    if (gap.gap_type === 'deficient' || gap.gap_type === 'missing') {
      nonCompliantEmployeeIds.add(gap.employee_id);
    }
  });
  
  compliantEmployees = uniqueEmployeeIds.size - nonCompliantEmployeeIds.size;
  const totalEmployees = uniqueEmployeeIds.size;

  if (totalEmployees === 0) return [{name: "No Data", value: 1}]; // Avoid division by zero, show full "No Data" pie

  return [
    { name: 'Compliant', value: compliantEmployees },
    { name: 'Non-Compliant', value: nonCompliantEmployeeIds.size },
  ];
};


export const aggregateDepartmentSkillGaps = (calculatedGaps: CalculatedGap[]): DepartmentSkillGap[] => {
  const departmentSkillMap = new Map<string, Map<string, number>>();

  calculatedGaps.forEach(gap => {
    if (gap.gap_type === 'deficient' || gap.gap_type === 'missing') {
      if (!departmentSkillMap.has(gap.department)) {
        departmentSkillMap.set(gap.department, new Map<string, number>());
      }
      const skillMap = departmentSkillMap.get(gap.department)!;
      skillMap.set(gap.skill, (skillMap.get(gap.skill) || 0) + 1);
    }
  });

  const result: DepartmentSkillGap[] = [];
  departmentSkillMap.forEach((skillMap, department) => {
    skillMap.forEach((gaps, skill) => {
      result.push({ department, skill, gaps });
    });
  });

  return result.sort((a,b) => b.gaps - a.gaps);
};
