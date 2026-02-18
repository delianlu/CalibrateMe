import React from 'react';
import { SessionData } from '../types';

interface ResponseHistoryProps {
  sessionData: SessionData[];
}

const ResponseHistory: React.FC<ResponseHistoryProps> = ({ sessionData }) => {
  // Show last 10 sessions
  const recentSessions = sessionData.slice(-10);

  return (
    <div className="card">
      <h3 className="card-title">Session History (Last 10)</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="response-table">
          <thead>
            <tr>
              <th>Session</th>
              <th>Items</th>
              <th>Correct</th>
              <th>Accuracy</th>
              <th>Mean Conf.</th>
              <th>Type 1</th>
              <th>Type 2</th>
              <th>Scaffolds</th>
              <th>Mean K*</th>
              <th>ECE</th>
            </tr>
          </thead>
          <tbody>
            {recentSessions.map((session) => {
              const accuracy = session.correct_count / session.items_reviewed;
              return (
                <tr key={session.session_number}>
                  <td>{session.session_number + 1}</td>
                  <td>{session.items_reviewed}</td>
                  <td>{session.correct_count}</td>
                  <td>
                    <span className={`badge ${accuracy > 0.7 ? 'badge-success' : 'badge-warning'}`}>
                      {(accuracy * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td>{(session.mean_confidence * 100).toFixed(0)}%</td>
                  <td>{session.type1_count}</td>
                  <td>{session.type2_count}</td>
                  <td>{session.scaffolds_delivered}</td>
                  <td>{session.mean_K_star.toFixed(2)}</td>
                  <td>{session.ece.toFixed(3)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResponseHistory;
