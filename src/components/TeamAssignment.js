import React, { useEffect, useMemo, useState, useCallback } from 'react';
import './TeamAssignment.css';

function TeamAssignment({
  teams,
  player,
  onAssign,
  onUndo,
  teamBudgets,
  teamBudgetLimit,
  players,
  assignedPlayers,
  lastAssigned
}) {
  const [bidPrice, setBidPrice] = useState(player.basePrice || 0);
  const [soldTo, setSoldTo] = useState(null);
  const [isFinalized, setIsFinalized] = useState(false);

  useEffect(() => {
    setBidPrice(player.basePrice || 0);
    setSoldTo(null);
    setIsFinalized(false);
  }, [player]);

  const category = useMemo(
    () => (player.category || player.role || '').toLowerCase(),
    [player]
  );

  const incrementalSteps = useMemo(
    () => ({
      allrounders: 2000,
      'allrounders-1': 1000,
      'best-batters-bowlers': 500,
      'wk-bat-bowl': 500,
      'new-to-game': 200
    }),
    []
  );

  const currentIncrement = incrementalSteps[category] || 500;

  const handleIncrement = () => {
    setBidPrice(prev => prev + currentIncrement);
  };

  const getCaptainCategory = useCallback(
    (team) => {
      const captain = players.find(
        p => p.name.toLowerCase().trim() === team.captain.toLowerCase().trim()
      );
      if (!captain) return null;
      return (captain.category || captain.role || '').toLowerCase();
    },
    [players]
  );

  const getViceCaptainCategory = useCallback(
    (team) => {
      if (!team.viceCaptain) return null;
      const viceCaptain = players.find(
        p =>
          p.name.toLowerCase().trim() ===
          team.viceCaptain.toLowerCase().trim()
      );
      if (!viceCaptain) return null;
      return (viceCaptain.category || viceCaptain.role || '').toLowerCase();
    },
    [players]
  );

  const teamCategoryCounts = useMemo(() => {
    const counts = {};

    teams.forEach(team => {
      const captainCategory = getCaptainCategory(team);
      const viceCaptainCategory = getViceCaptainCategory(team);

      counts[team.id] = {
        captainCategory,
        viceCaptainCategory,
        categoryCounts: {}
      };

      const countCategory = (cat) => {
        counts[team.id].categoryCounts[cat] =
          (counts[team.id].categoryCounts[cat] || 0) + 1;
      };

      if (captainCategory) countCategory(captainCategory);
      if (
        viceCaptainCategory &&
        viceCaptainCategory !== captainCategory
      ) {
        countCategory(viceCaptainCategory);
      }

      Object.entries(assignedPlayers || {}).forEach(([playerId, info]) => {
        if (info?.teamId !== team.id) return;

        const p = players.find(pl => pl.id === playerId);
        if (!p) return;

        const pName = p.name.toLowerCase().trim();
        if (
          pName === team.captain.toLowerCase().trim() ||
          (team.viceCaptain &&
            pName === team.viceCaptain.toLowerCase().trim())
        ) {
          return;
        }

        const cat = (p.category || p.role || '').toLowerCase();
        countCategory(cat);
      });
    });

    return counts;
  }, [
    teams,
    players,
    assignedPlayers,
    getCaptainCategory,
    getViceCaptainCategory
  ]);

  const canTakePlayer = (team) => {
    const teamCounts = teamCategoryCounts[team.id];
    if (!teamCounts) return true;

    const categoryCounts = teamCounts.categoryCounts || {};
    const currentCount = categoryCounts[category] || 0;

    if (category === 'allrounders' && currentCount >= 1) return false;
    if (category === 'allrounders-p' && currentCount >= 1) return false;
    if (category === 'allrounders-1' && currentCount >= 2) return false;

    if (
      !['allrounders', 'allrounders-1', 'allrounders-p'].includes(category)
    ) {
      if (
        teamCounts.captainCategory === category ||
        teamCounts.viceCaptainCategory === category
      ) {
        if (currentCount > 1) return false;
      }
    }

    return true;
  };

  const handleTentativeAssign = (teamId) => {
    setSoldTo(teamId);
  };

  const handleFinalizeSale = () => {
    if (!soldTo) return;
    setIsFinalized(true);
    onAssign(soldTo, bidPrice);
  };

  const handleReopenBidding = () => {
    setSoldTo(null);
  };

  const handleUndo = () => {
    if (lastAssigned && onUndo) {
      onUndo(lastAssigned.playerId);
      setSoldTo(null);
      setIsFinalized(false);
    }
  };

  if (isFinalized) {
    const soldTeam = teams.find(t => t.id === soldTo);
    return (
      <div className="team-assignment-overlay">
        <div className="team-assignment-modal compact sold-confirmation">
          <div className="sold-badge">✓ SOLD</div>
          <h3>{player.name}</h3>
          <div className="sold-details">
            <div>Sold to <strong>{soldTeam?.name}</strong></div>
            <div>
              Sale Amount <strong>₹{bidPrice.toLocaleString('en-IN')}</strong>
            </div>
          </div>
          {onUndo && lastAssigned && (
            <button className="undo-button" onClick={handleUndo}>
              ↶ Undo Assignment
            </button>
          )}
        </div>
      </div>
    );
  }

  if (soldTo) {
    const soldTeam = teams.find(t => t.id === soldTo);
    return (
      <div className="team-assignment-overlay">
        <div className="team-assignment-modal compact sold-confirmation">
          <div className="sold-badge pending">PENDING CONFIRMATION</div>
          <h3>{player.name}</h3>
          <div className="sold-details">
            <div>Sold to <strong>{soldTeam?.name}</strong></div>
            <div>
              Sale Amount <strong>₹{bidPrice.toLocaleString('en-IN')}</strong>
            </div>
          </div>
          <button className="confirm-button" onClick={handleFinalizeSale}>
            ✓ CONFIRM & NEXT PLAYER
          </button>
          <button
            className="undo-button secondary"
            onClick={handleReopenBidding}
          >
            ↶ Reopen Bidding
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="team-assignment-overlay">
      <div className="team-assignment-modal compact">
        <h3>Assign Player</h3>
        <p className="assignment-player-name">{player.name}</p>

        <div className="bid-input-compact">
          <label>Current Bid ₹</label>
          <div className="bid-control-group">
            <input
              type="number"
              min={player.basePrice || 0}
              value={bidPrice}
              onChange={e =>
                setBidPrice(Math.max(player.basePrice || 0, Number(e.target.value)))
              }
            />
            <button className="increment-btn" onClick={handleIncrement}>
              + {currentIncrement.toLocaleString('en-IN')}
            </button>
          </div>
        </div>

        <div className="teams-grid-compact">
          {teams.map(team => {
            const insufficientBudget =
              (teamBudgets[team.id] ?? teamBudgetLimit) < bidPrice;
            const roleBlocked = !canTakePlayer(team);
            const disabled = insufficientBudget || roleBlocked;

            return (
              <button
                key={team.id}
                disabled={disabled}
                onClick={() => handleTentativeAssign(team.id)}
                className={`team-card-compact ${disabled ? 'disabled' : ''}`}
              >
                <div>{team.name}</div>
                <div>
                  ₹{(teamBudgets[team.id] ?? teamBudgetLimit).toLocaleString('en-IN')}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TeamAssignment;
