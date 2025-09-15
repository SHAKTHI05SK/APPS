
import React from 'react';
import { AISkillAnalysisResults, TrainingRecommendation, HiringSuggestion, UpskillingPriority } from '../types';
import { LightBulbIcon, AcademicCapIcon, UserGroupIcon, ArrowTrendingUpIcon, InformationCircleIcon } from './common/Icons';

interface SuggestionsPanelProps {
  results: AISkillAnalysisResults;
}

const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({ results }) => {
  const { trainingRecommendations, hiringSuggestions, upskillingPriorities, overallSummary } = results;

  const hasContent = trainingRecommendations?.length || hiringSuggestions?.length || upskillingPriorities?.length || overallSummary;

  if (!hasContent) {
     return (
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <InformationCircleIcon className="h-12 w-12 text-secondary-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-secondary-700">No AI Suggestions Available</h3>
        <p className="text-gray-500 mt-2">The AI analysis did not yield specific suggestions, or the data might be insufficient. Try processing with different data if available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {overallSummary && (
        <div className="p-6 bg-primary-50 rounded-lg shadow-md border-l-4 border-primary-500"> {/* Golden themed box */}
          <h2 className="text-xl font-semibold text-secondary-800 mb-3 flex items-center">
            <LightBulbIcon className="h-6 w-6 mr-2 text-primary-600" /> {/* Golden icon */}
            Overall AI Summary
          </h2>
          <p className="text-secondary-700">{overallSummary}</p>
        </div>
      )}

      {trainingRecommendations && trainingRecommendations.length > 0 && (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-secondary-800 mb-4 flex items-center">
            <AcademicCapIcon className="h-6 w-6 mr-2 text-secondary-600" /> {/* Teal icon */}
            Training Recommendations
          </h2>
          <div className="space-y-4">
            {trainingRecommendations.map((rec, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-md border border-gray-200">
                <h3 className="font-semibold text-secondary-700">
                  {rec.name ? `${rec.name} (${rec.employee_id})` : ''} {rec.role ? `Role: ${rec.role}` : ''}
                </h3>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-1 space-y-1">
                  {rec.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {hiringSuggestions && hiringSuggestions.length > 0 && (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-secondary-800 mb-4 flex items-center">
            <UserGroupIcon className="h-6 w-6 mr-2 text-secondary-600" /> {/* Teal icon */}
            Hiring Suggestions
          </h2>
          <div className="space-y-4">
            {hiringSuggestions.map((suggestion, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-md border border-gray-200">
                <h3 className="font-semibold text-secondary-700">Role: {suggestion.role}</h3>
                <p className="text-sm text-gray-600 mt-1">{suggestion.hiring_suggestion}</p>
                {suggestion.profile_keywords && suggestion.profile_keywords.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Ideal Keywords: {suggestion.profile_keywords.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {upskillingPriorities && upskillingPriorities.length > 0 && (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-secondary-800 mb-4 flex items-center">
            <ArrowTrendingUpIcon className="h-6 w-6 mr-2 text-secondary-600" /> {/* Teal icon */}
            Upskilling Priorities
          </h2>
          <div className="space-y-4">
            {upskillingPriorities.map((priority, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-md border border-gray-200">
                <h3 className="font-semibold text-secondary-700">{priority.skill}</h3>
                <p className="text-sm text-gray-600 mt-1">{priority.justification}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestionsPanel;