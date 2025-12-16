import React, { useEffect, useMemo, useState } from 'react';
import './TeamAssignment.css';

function TeamAssignment({
  teams,
  player,
  onAssign,
  onUndo,
  onUnsold,
  teamBudgets,
  teamBudgetLimit,
  players,
  assignedPlayers,
  lastAssigned
}) {
  const [bidPrice, setBidPrice] = useState(player.basePrice || 0);
  const [soldTo, setSoldTo] = useState(null); // Team ID, set after first click
  const [isFinalized, setIsFinalized] = useState(false); // True when onAssign has been called

  useEffect(() => {
    // Reset state when a new player is brought up for auction
    setBidPrice(player.basePrice || 0);
    setSoldTo(null);
    setIsFinalized(false);
  }, [player]);

  const category = useMemo(() => (player.category || player.role || '').toLowerCase(), [player]);

  // --- LOGIC: Define and calculate the increment ---
  const incrementalSteps = useMemo(() => ({
    'allrounders': 2000,
    'allrounders-1': 1000,
    'best-batters-bowlers': 500,
    'wk-bat-bowl': 500,
    'new-to-game': 200,
  }), []);

  const currentIncrement = incrementalSteps[category] || 500; 

  const handleIncrement = () => {
    const newPrice = bidPrice + currentIncrement;
    setBidPrice(newPrice);
  };
  // --- END INCREMENT LOGIC ---

  // NOTE: getCaptainCategory and getViceCaptainCategory functions are removed 
  // as their logic is now integrated into teamCategoryCounts.

  // --- REVISED LOGIC: COUNTS C/VC AND ALL ASSIGNED PLAYERS ---
  const teamCategoryCounts = useMemo(() => {
    const counts = {};
    teams.forEach(team => {
      counts[team.id] = {
        allrounders: 0,
        allrounders1: 0,
        allroundersP: 0,
        categoryCounts: {} // Generic count for each category
      };

      // Helper to count player in specific category fields
      const countPlayerCategory = (cat, teamId) => {
        counts[teamId].categoryCounts[cat] = (counts[teamId].categoryCounts[cat] || 0) + 1;
        if (cat === 'allrounders-1') {
          counts[teamId].allrounders1 += 1;
        }
        if (cat === 'allrounders-p') {
          counts[teamId].allroundersP += 1;
        }
        if (cat === 'allrounders') {
          counts[teamId].allrounders += 1;
        }
      };

      // Iterate over ALL players to establish the current roster size and category breakdown
      players.forEach(p => {
          const isAssignedToThisTeam = assignedPlayers[p.id]?.teamId === team.id;
          const isCaptain = p.name.toLowerCase().trim() === team.captain.toLowerCase().trim();
          const isViceCaptain = team.viceCaptain && p.name.toLowerCase().trim() === team.viceCaptain.toLowerCase().trim();
          
          // CRITICAL: Count the player if they are officially assigned OR they are a designated C/VC
          if (isAssignedToThisTeam || isCaptain || isViceCaptain) {
              const cat = (p.category || p.role || '').toLowerCase();
              countPlayerCategory(cat, team.id);
          }
      });
    });
    return counts;
  }, [assignedPlayers, players, teams]);
  // --- END REVISED COUNTING LOGIC ---

  
  // --- REVISED LOGIC: CHECKING RULES (INCLUDING MAX 10 PLAYERS) ---
  const canTakePlayer = (team) => {
    const teamCounts = teamCategoryCounts[team.id] || {};
    const categoryCounts = teamCounts.categoryCounts || {};
    
    // Calculate Roster Size
    const currentRosterSize = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);

    // Check if the player currently being auctioned is already included in the count (i.e., if they are C/VC)
    const isPlayerAlreadyInCount = players.some(p => p.id === player.id && (
        assignedPlayers[p.id]?.teamId === team.id || 
        p.name.toLowerCase().trim() === team.captain.toLowerCase().trim() || 
        (team.viceCaptain && p.name.toLowerCase().trim() === team.viceCaptain.toLowerCase().trim())
    ));
    
    // Only count the CURRENT player being auctioned if they are NOT already counted as C/VC
    const countIfNew = isPlayerAlreadyInCount ? 0 : 1; 
    
    const projectedRosterSize = currentRosterSize + countIfNew;
    
    // ---------------------------------------------
    // --- RULE 1: ABSOLUTE MAX 10 PLAYERS ---
    // ---------------------------------------------
    if (projectedRosterSize > 10) {
      return false; // Cannot bid, max roster size reached
    }
    
    // ---------------------------------------------
    // --- RULE 2: CATEGORY LIMITS ---
    // ---------------------------------------------
    const currentCategoryCount = categoryCounts[category] || 0;
    const projectedCategoryCount = currentCategoryCount + countIfNew;

    // 2.1 Allrounders (max 1 total)
    if (category === 'allrounders') {
      if (projectedCategoryCount > 1) return false;
    }
    
    // 2.2 Allrounders-P (max 1 total)
    if (category === 'allrounders-p') {
      if (projectedCategoryCount > 1) return false;
    }
    
    // 2.3 Allrounders-1 (max 2 total)
    if (category === 'allrounders-1') {
      if (projectedCategoryCount > 2) return false;
    }

    return true; // All rules passed
  };
  // --- END REVISED RULE CHECKING LOGIC ---


  // --- MODIFIED HANDLERS for 2-STEP PROCESS ---

  const handleTentativeAssign = (teamId) => {
    setSoldTo(teamId);
  };

  const handleFinalizeSale = () => {
    if (soldTo) {
      setIsFinalized(true);
      onAssign(soldTo, bidPrice);
    }
  };

  const handleReopenBidding = () => {
    setSoldTo(null);
  };

  const handleUnsoldClick = () => { 
    if (window.confirm(`Are you sure you want to mark ${player.name} as UNSOLD? They will be available in the final round.`)) {
      onUnsold(player.id);
    }
  };

  const handleUndo = () => {
    if (lastAssigned && onUndo) {
      onUndo(lastAssigned.playerId);
      setSoldTo(null);
      setIsFinalized(false);
    }
  };

  // --- RENDER LOGIC ---

  if (isFinalized) {
    const soldTeam = teams.find(t => t.id === soldTo);
    return (
      <div className="team-assignment-overlay">
        <div className="team-assignment-modal compact sold-confirmation">
          <div className="sold-badge">✓ SOLD</div>
          <h3>{player.name}</h3>
          <div className="sold-details">
            <div className="sold-to">Sold to: <strong>{soldTeam?.name}</strong></div>
            <div className="sold-price">Sale Amount: <strong>₹{bidPrice.toLocaleString('en-IN')}</strong></div>
            <div className="sold-captain">Captain: {soldTeam?.captain}</div>
          </div>
          {/* Undo button for the LAST action */}
          {onUndo && lastAssigned && (
            <button className="undo-button" onClick={handleUndo}>
              ↶ Undo Assignment
            </button>
          )}
        </div>
      </div>
    );
  }

  if (soldTo && !isFinalized) {
    const soldTeam = teams.find(t => t.id === soldTo);
    return (
      <div className="team-assignment-overlay">
        <div className="team-assignment-modal compact sold-confirmation">
          <div className="sold-badge pending">PENDING CONFIRMATION</div>
          <h3>{player.name}</h3>
          <div className="sold-details">
            <div className="sold-to">Tentatively Sold to: <strong>{soldTeam?.name}</strong></div>
            <div className="sold-price">Sale Amount: <strong>₹{bidPrice.toLocaleString('en-IN')}</strong></div>
          </div>
          <button className="confirm-button" onClick={handleFinalizeSale}>
            ✓ CONFIRM & NEXT PLAYER
          </button>
          <button className="undo-button secondary" onClick={handleReopenBidding}>
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
        
        {/* --- BID INPUT SECTION --- */}
        <div className="bid-input-compact">
          <label htmlFor="bid-amount">Current Bid (₹)</label>
          <div className="bid-control-group">
            <input
              id="bid-amount"
              type="number"
              min={player.basePrice || 0}
              value={bidPrice}
              onChange={(e) => {
                let val = Number(e.target.value);
                if (val < player.basePrice) val = player.basePrice;
                setBidPrice(val);
              }}
              className="bid-input"
            />
            <button
              className="increment-btn"
              onClick={handleIncrement}
            >
              + {currentIncrement.toLocaleString('en-IN')}
            </button>
          </div>
          <div className="category-increment-info">
              Set: **{category.toUpperCase()}** | Increment: **₹{currentIncrement.toLocaleString('en-IN')}**
          </div>
        </div>
        {/* --- END BID INPUT SECTION --- */}
        
        <div className="teams-grid-compact">
          {teams.map(team => {
            const teamCounts = teamCategoryCounts[team.id] || {};
            const currentRosterSize = Object.values(teamCounts.categoryCounts || {}).reduce((sum, count) => sum + count, 0);
            
            // Re-check Max 10 rule here for the display reason
            const isPlayerAlreadyInCount = players.some(p => p.id === player.id && (
                assignedPlayers[p.id]?.teamId === team.id || 
                p.name.toLowerCase().trim() === team.captain.toLowerCase().trim() || 
                (team.viceCaptain && p.name.toLowerCase().trim() === team.viceCaptain.toLowerCase().trim())
            ));
            const countIfNew = isPlayerAlreadyInCount ? 0 : 1;
            const projectedRosterSize = currentRosterSize + countIfNew;


            const budgetInsufficient = (teamBudgets[team.id] ?? teamBudgetLimit) < bidPrice;
            const invalidBid = bidPrice <= 0;
            const roleRestriction = !canTakePlayer(team);
            
            const isDisabled = budgetInsufficient || invalidBid || roleRestriction;
            
            let disableReason = '';
            
            // Highest priority disable reason
            if (projectedRosterSize > 10) {
                disableReason = `Max 10 player limit reached (${currentRosterSize} already signed)`;
            } else if (budgetInsufficient) {
              disableReason = 'Insufficient budget';
            } else if (roleRestriction) {
              // This is now purely category limit restriction
              if (category === 'allrounders') {
                disableReason = 'Allrounder limit reached (Max 1)';
              } else if (category === 'allrounders-1') {
                disableReason = 'Allrounders-1 limit reached (Max 2)';
              } else if (category === 'allrounders-p') {
                disableReason = 'Allrounders-P limit reached (Max 1)';
              } else {
                disableReason = 'Role limit reached';
              }
            }
            
            return (
              <button
                key={team.id}
                className={`team-card-compact ${isDisabled ? 'disabled' : ''}`}
                onClick={() => handleTentativeAssign(team.id)}
                disabled={isDisabled}
                title={isDisabled ? `${team.name}: ${disableReason}` : `${team.name} - Budget: ₹${(teamBudgets[team.id] ?? teamBudgetLimit).toLocaleString('en-IN')}`}
              >
                <div className="team-name-compact">{team.name}</div>
                <div className="team-budget-compact">₹{(teamBudgets[team.id] ?? teamBudgetLimit).toLocaleString('en-IN')}</div>
                {isDisabled && (
                  <div className="budget-warning-compact">{disableReason}</div>
                )}
              </button>
            );
          })}
        </div>
        
        <button className="unsold-button" onClick={handleUnsoldClick}>
          ❌ Mark as UNSOLD
        </button>
      </div>
    </div>
  );
}

export default TeamAssignment;
