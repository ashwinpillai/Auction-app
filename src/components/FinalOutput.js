import React from 'react';
import * as XLSX from 'xlsx';
import './FinalOutput.css';

function FinalOutput({ players, teams, assignedPlayers, teamBudgets, teamBudgetLimit }) {
  const getTeamPlayers = (teamId) => {
    return players.filter(player => assignedPlayers[player.id]?.teamId === teamId);
  };

  const handleDownload = () => {
    const data = teams.map(team => {
      const teamPlayers = getTeamPlayers(team.id);
      const remaining = teamBudgets[team.id] ?? teamBudgetLimit;
      const spent = teamBudgetLimit - remaining;
      return {
        'Team Name': team.name,
        'Captain': team.captain,
        'Total Players': teamPlayers.length,
        'Players': teamPlayers.map(p => p.name).join(', '),
        'Roles': teamPlayers.map(p => p.role).join(', '),
        'Total Spend': teamPlayers.reduce((sum, p) => sum + (assignedPlayers[p.id]?.price || 0), 0),
        'Budget Remaining': remaining,
        'Budget Spent': spent
      };
    });

    // Add unassigned players section
    const unassignedPlayers = players.filter(p => !assignedPlayers[p.id]);
    if (unassignedPlayers.length > 0) {
      data.push({
        'Team Name': 'Unassigned Players',
        'Captain': '-',
        'Total Players': unassignedPlayers.length,
        'Players': unassignedPlayers.map(p => p.name).join(', '),
        'Roles': unassignedPlayers.map(p => p.role).join(', '),
        'Total Base Price': unassignedPlayers.reduce((sum, p) => sum + p.basePrice, 0)
      });
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Auction Results');
    
    // Auto-size columns
    const colWidths = [
      { wch: 20 }, // Team Name
      { wch: 20 }, // Captain
      { wch: 15 }, // Total Players
      { wch: 50 }, // Players
      { wch: 50 }, // Roles
      { wch: 18 }, // Total Spend
      { wch: 20 }, // Budget Remaining
      { wch: 18 }  // Budget Spent
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'Cricket_Auction_Results.xlsx');
  };

  return (
    <div className="final-output">
      <div className="output-header">
        <h2>🏆 Auction Results</h2>
        <button className="download-btn" onClick={handleDownload}>
          📥 Download Results
        </button>
      </div>

      <div className="teams-container">
        {teams.map(team => {
          const teamPlayers = getTeamPlayers(team.id);
          const remaining = teamBudgets[team.id] ?? teamBudgetLimit;
          const spent = teamBudgetLimit - remaining;
          return (
            <div key={team.id} className="team-result-card">
              <div className="team-header">
                <h3>{team.name}</h3>
                <div className="team-captain-badge">Captain: {team.captain}</div>
              </div>
              <div className="team-stats">
                <div className="stat">
                  <span className="stat-label">Players:</span>
                  <span className="stat-value">{teamPlayers.length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Total Spend:</span>
                  <span className="stat-value">
                    ₹{teamPlayers.reduce((sum, p) => sum + (assignedPlayers[p.id]?.price || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Remaining Budget:</span>
                  <span className="stat-value">
                    ₹{remaining.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Spent vs Cap:</span>
                  <span className="stat-value">
                    ₹{spent.toLocaleString('en-IN')} / ₹{teamBudgetLimit.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <div className="players-list">
                {teamPlayers.length > 0 ? (
                  <table className="players-table">
                    <thead>
                      <tr>
                        <th>Player Name</th>
                        <th>Role</th>
                        <th>Base Price</th>
                        <th>Bid Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamPlayers.map(player => (
                        <tr key={player.id}>
                          <td>{player.name}</td>
                          <td>
                            <span className="role-badge">{player.role}</span>
                          </td>
                          <td>₹{player.basePrice.toLocaleString('en-IN')}</td>
                          <td>₹{(assignedPlayers[player.id]?.price || 0).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-players">No players assigned yet</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {players.filter(p => !assignedPlayers[p.id]).length > 0 && (
        <div className="unassigned-section">
          <h3>Unassigned Players</h3>
          <div className="unassigned-players">
            {players
              .filter(p => !assignedPlayers[p.id])
              .map(player => (
                <div key={player.id} className="unassigned-player-card">
                  <span className="player-name">{player.name}</span>
                  <span className="player-role">{player.role}</span>
                  <span className="player-price">₹{player.basePrice.toLocaleString('en-IN')}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FinalOutput;