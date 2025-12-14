import React from 'react';
import './TeamSidebar.css';

function TeamSidebar({ teams, players, assignedPlayers, teamBudgets, teamBudgetLimit, onDownload }) {
  const getTeamPlayers = (teamId) =>
    players.filter(p => assignedPlayers[p.id]?.teamId === teamId);

  const counts = (teamId) => {
    const teamPlayers = getTeamPlayers(teamId);
    const allr = teamPlayers.filter(p => String(p.category || p.role || '').toLowerCase().includes('allrounder')).length;
    const allrP = teamPlayers.filter(p => String(p.category || p.role || '').toLowerCase().includes('allrounders-p')).length;
    return { allr, allrP };
  };

  return (
    <aside className="team-sidebar">
      <div className="sidebar-header">
        <h3>Teams</h3>
        <button className="sidebar-download" onClick={onDownload}>
          📥 Download Sheet
        </button>
      </div>
      <div className="sidebar-list">
        {teams.map(team => {
          const teamPlayers = getTeamPlayers(team.id);
          const remaining = teamBudgets[team.id] ?? teamBudgetLimit;
          const { allr, allrP } = counts(team.id);
          return (
            <div key={team.id} className="sidebar-card">
              <div className="sidebar-card-top">
                <div>
                  <div className="sidebar-team-name">{team.name}</div>
                  <div className="sidebar-captain">Captain: {team.captain}</div>
                  {team.viceCaptain && (
                    <div className="sidebar-vice-captain">VC: {team.viceCaptain}</div>
                  )}
                </div>
                <div className="sidebar-chip">Players: {teamPlayers.length}</div>
              </div>
              <div className="sidebar-budget">
                Remaining: ₹{remaining.toLocaleString('en-IN')}
              </div>
              <div className="sidebar-badge-row">
                <span className="sidebar-badge allr">All-rounders: {allr}/2</span>
                <span className="sidebar-badge allrp">Allrounders-P: {allrP}/1</span>
              </div>
              <div className="sidebar-players">
                {teamPlayers.length > 0 ? teamPlayers.map(p => (
                  <span key={p.id} className="sidebar-player-pill">
                    {p.name} ({p.role})
                  </span>
                )) : <span className="sidebar-empty">No players yet</span>}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export default TeamSidebar;