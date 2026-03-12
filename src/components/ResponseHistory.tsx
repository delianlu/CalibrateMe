import React, { useMemo } from 'react';
import { SessionData } from '../types';

interface ResponseHistoryProps {
  sessionData: SessionData[];
}

const ResponseHistory: React.FC<ResponseHistoryProps> = ({ sessionData }) => {
  const recentSessions = useMemo(() => sessionData.slice(-10), [sessionData]);

  return (
    <div className="card">
      <h3 className="card-title">Session History (Last 10)</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="response-table" aria-label="Session history">
          <thead>
            <tr>
              <th scope="col">Session</th>
              <th scope="col">Items</th>
              <th scope="col">Correct</th>
              <th scope="col">Accuracy</th>
              <th scope="col">Mean Conf.</th>
              <th scope="col">Type 1</th>
              <th scope="col">Type 2</th>
              <th scope="col">Scaffolds</th>
              <th scope="col">Mean K*</th>
              <th scope="col">ECE</th>
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
