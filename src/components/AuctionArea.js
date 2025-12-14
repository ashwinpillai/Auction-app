import React, { useMemo} from 'react';
import './AuctionArea.css';
import PlayerPopup from './PlayerPopup';
import TeamAssignment from './TeamAssignment';
import TeamSidebar from './TeamSidebar';
import * as XLSX from 'xlsx';

function AuctionArea({
  players,
  teams,
  currentPlayer,
  setCurrentPlayer,
  assignedPlayers,
  onPlayerAssigned,
  onUndoAssignment,
  onAuctionComplete,
  unassignedPlayers,
  teamBudgets,
  teamBudgetLimit,
  lastAssigned
}) {
  const categoryOrder = useMemo(
    () => ['new-to-game', 'wk-bat-bowl', 'best-batters-bowlers', 'allrounders-1', 'allrounders'],
    []
  );

  const pickNextPlayer = () => {
    if (unassignedPlayers.length === 0) return null;
    for (const cat of categoryOrder) {
      const candidates = unassignedPlayers.filter(
        p => (p.category || '').toLowerCase() === cat
      );
      if (candidates.length > 0) {
        const randomIndex = Math.floor(Math.random() * candidates.length);
        return candidates[randomIndex];
      }
    }
    // fallback to any
    const randomIndex = Math.floor(Math.random() * unassignedPlayers.length);
    return unassignedPlayers[randomIndex];
  };

  const handleRandomPlayer = () => {
    const next = pickNextPlayer();
    if (!next) {
      alert('All players have been assigned!');
      return;
    }
    setCurrentPlayer(next);
  };

  const handleAssignToTeam = (teamId, bidPrice) => {
    if (!currentPlayer) return;

    const price = Number(bidPrice);
    if (!Number.isFinite(price) || price <= 0) {
      alert('Please enter a valid bid amount.');
      return;
    }

    if (price < currentPlayer.basePrice) {
      alert(`Bid must be at least the base price (₹${currentPlayer.basePrice.toLocaleString('en-IN')}).`);
      return;
    }

    const remaining = teamBudgets[teamId] ?? teamBudgetLimit;
    if (price > remaining) {
      alert('This team does not have enough budget remaining for this bid.');
      return;
    }

    // Call the parent state handler to finalize assignment
    onPlayerAssigned(currentPlayer.id, teamId, price);
    // Clear the current player to move the auction forward
    setCurrentPlayer(null);
  };

  const handleCompleteAuction = () => {
    if (window.confirm('Are you sure you want to complete the auction? All unassigned players will be skipped.')) {
      onAuctionComplete();
    }
  };

  const assignedCount = Object.keys(assignedPlayers).length;
  const totalPlayers = players.length;
  const remainingPlayers = unassignedPlayers.length;

  const handleDownloadResults = () => {
    const getTeamPlayers = (teamId) =>
      players.filter(p => assignedPlayers[p.id]?.teamId === teamId);

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
        'Categories': teamPlayers.map(p => p.category || '').join(', '),
        'Total Spend': teamPlayers.reduce((sum, p) => sum + (assignedPlayers[p.id]?.price || 0), 0),
        'Budget Remaining': remaining,
        'Budget Spent': spent
      };
    });

    const unassigned = players.filter(p => !assignedPlayers[p.id]);
    if (unassigned.length > 0) {
      data.push({
        'Team Name': 'Unassigned Players',
        'Captain': '-',
        'Total Players': unassigned.length,
        'Players': unassigned.map(p => p.name).join(', '),
        'Roles': unassigned.map(p => p.role).join(', '),
        'Total Spend': unassigned.reduce((sum, p) => sum + (p.basePrice || 0), 0),
        'Budget Remaining': '-',
        'Budget Spent': '-'
      });
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Auction Snapshot');
    ws['!cols'] = [
      { wch: 22 },
      { wch: 18 },
      { wch: 15 },
      { wch: 50 },
      { wch: 40 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 }
    ];
    XLSX.writeFile(wb, 'Auction_Snapshot.xlsx');
  };

  return (
    <div className="auction-layout">
      <div className="auction-area">
        <div className="auction-header">
          <h2>Auction in Progress</h2>
          <div className="auction-stats">
            <div className="stat-box">
              <span className="stat-label">Total Players</span>
              <span className="stat-value">{totalPlayers}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Assigned</span>
              <span className="stat-value">{assignedCount}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Remaining</span>
              <span className="stat-value">{remainingPlayers}</span>
            </div>
            <div className="stat-box budget-box">
              <span className="stat-label">Budget / Team</span>
              <span className="stat-value">₹{teamBudgetLimit.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="team-budgets">
            {teams.map(team => (
              <div key={team.id} className="budget-pill">
                <span className="budget-team-name">{team.name}</span>
                <span className="budget-amount">₹{(teamBudgets[team.id] ?? teamBudgetLimit).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="auction-controls">
          <button
            className="random-player-btn"
            onClick={handleRandomPlayer}
            disabled={remainingPlayers === 0}
          >
            📋 Select Random Player
          </button>
          <button
            className="finish-auction-btn"
            onClick={handleCompleteAuction}
          >
            🛑 Finish Auction
          </button>
          <button
            className="download-snapshot-btn"
            onClick={handleDownloadResults}
          >
            📝 Download Snapshot
          </button>
        </div>

        {currentPlayer && (
          <div className="live-auction-row">
            <PlayerPopup
              player={currentPlayer}
              show
            />
            <TeamAssignment
              teams={teams}
              player={currentPlayer}
              teamBudgets={teamBudgets}
              teamBudgetLimit={teamBudgetLimit}
              players={players}
              assignedPlayers={assignedPlayers}
              onAssign={handleAssignToTeam}
              onUndo={onUndoAssignment}
              lastAssigned={lastAssigned}
            />
          </div>
        )}

        {remainingPlayers === 0 && (
          <div className="auction-complete-notice">
            <h3>🎉 All players have been assigned!</h3>
            <button
              className="view-results-btn"
              onClick={handleCompleteAuction}
            >
              View Final Results
            </button>
          </div>
        )}
      </div>

      <TeamSidebar
        teams={teams}
        players={players}
        assignedPlayers={assignedPlayers}
        teamBudgets={teamBudgets}
        teamBudgetLimit={teamBudgetLimit}
        onDownload={handleDownloadResults}
      />
    </div>
  );
}

export default AuctionArea;
