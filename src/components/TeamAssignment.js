import React, { useEffect, useMemo, useState } from 'react';
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
  const [soldTo, setSoldTo] = useState(null); // Team ID, set after first click
  const [isFinalized, setIsFinalized] = useState(false); // True when onAssign has been called

  useEffect(() => {
    // Reset state when a new player is brought up for auction
    setBidPrice(player.basePrice || 0);
    setSoldTo(null);
    setIsFinalized(false);
  }, [player]);

  const category = useMemo(() => (player.category || player.role || '').toLowerCase(), [player]);

  // --- NEW LOGIC: Define and calculate the increment ---
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
  // --- END NEW LOGIC ---

  // Utility to find and get the category of a Captain/VC
  const getCaptainCategory = (team) => {
    const captain = players.find(p => 
      p.name.toLowerCase().trim() === team.captain.toLowerCase().trim()
    );
    if (!captain) return null;
    return (captain.category || captain.role || '').toLowerCase();
  };

  const getViceCaptainCategory = (team) => {
    if (!team.viceCaptain) return null;
    const viceCaptain = players.find(p => 
      p.name.toLowerCase().trim() === team.viceCaptain.toLowerCase().trim()
    );
    if (!viceCaptain) return null;
    return (viceCaptain.category || viceCaptain.role || '').toLowerCase();
  };

  // Memoized count of assigned players by category for each team
  const teamCategoryCounts = useMemo(() => {
    const counts = {};
    teams.forEach(team => {
      const captainCategory = getCaptainCategory(team);
      const viceCaptainCategory = getViceCaptainCategory(team);
      counts[team.id] = {
        allrounders: 0,
        allrounders1: 0,
        allroundersP: 0,
        captainCategory: captainCategory,
        viceCaptainCategory: viceCaptainCategory,
        categoryCounts: {} // Generic count for each category
      };

      // Helper to count player in specific category fields
      const countPlayerCategory = (cat) => {
        counts[team.id].categoryCounts[cat] = (counts[team.id].categoryCounts[cat] || 0) + 1;
        if (cat === 'allrounders-1') {
          counts[team.id].allrounders1 += 1;
        }
        if (cat === 'allrounders-p') {
          counts[team.id].allroundersP += 1;
        }
        if (cat === 'allrounders') {
          counts[team.id].allrounders += 1;
        }
      };

      // Count captain and vice-captain
      if (captainCategory) countPlayerCategory(captainCategory);
      if (viceCaptainCategory && viceCaptainCategory !== captainCategory) countPlayerCategory(viceCaptainCategory);

      // Count assigned players
      Object.entries(assignedPlayers || {}).forEach(([playerId, info]) => {
        if (info?.teamId !== team.id) return;
        const p = players.find(pl => pl.id === playerId);
        if (!p) return;
        const cat = (p.category || p.role || '').toLowerCase();
        
        // Skip if this is the captain or vice-captain (already counted above)
        if (p.name.toLowerCase().trim() === team.captain.toLowerCase().trim() ||
            (team.viceCaptain && p.name.toLowerCase().trim() === team.viceCaptain.toLowerCase().trim())) {
          return;
        }
        
        // Count in category
        countPlayerCategory(cat);
      });
    });
    return counts;
  }, [assignedPlayers, players, teams]);

  // Logic to check if a team can take the current player based on role restrictions
  const canTakePlayer = (team) => {
    const teamCounts = teamCategoryCounts[team.id] || {};
    const captainCat = teamCounts.captainCategory;
    const viceCaptainCat = teamCounts.viceCaptainCategory;
    const categoryCounts = teamCounts.categoryCounts || {};
    
    // Total count of players (including C/VC) already in this category
    const currentCategoryCount = categoryCounts[category] || 0;
    
    // --- Rule Enforcement ---
    
    // 1. Allrounders (max 1 total)
    if (category === 'allrounders') {
      if (currentCategoryCount >= 1) return false;
    }
    
    // 2. Allrounders-P (max 1 total)
    if (category === 'allrounders-p') {
      if (currentCategoryCount >= 1) return false;
    }
    
    // 3. Allrounders-1 (max 2 total)
    if (category === 'allrounders-1') {
      if (currentCategoryCount >= 2) return false;
    }

    // 4. Other Categories where C/VC is present (max 1 more allowed)
    if (!['allrounders', 'allrounders-1', 'allrounders-p'].includes(category)) {
      if ((captainCat === category) || (viceCaptainCat === category)) {
        if (currentCategoryCount > 1) return false; // Max 1 assigned player allowed
      }
    }
    
    return true;
  };

  // --- MODIFIED HANDLERS for 2-STEP PROCESS ---

  const handleTentativeAssign = (teamId) => {
    // Stage 1: Record the sale locally (shows confirmation modal)
    setSoldTo(teamId);
  };

  const handleFinalizeSale = () => {
    // Stage 3: Call parent function to finalize assignment and move to next player
    if (soldTo) {
      setIsFinalized(true);
      onAssign(soldTo, bidPrice);
    }
  };

  const handleReopenBidding = () => {
    // Clear the tentative selection
    setSoldTo(null);
  };

  const handleUndo = () => {
    if (lastAssigned && onUndo) {
      onUndo(lastAssigned.playerId);
      // Reset state to ensure component shows next player's assignment grid
      setSoldTo(null);
      setIsFinalized(false);
    }
  };

  // --- RENDER LOGIC ---

  // Check 1: If player is finalized (onAssign called), show the final sold view.
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

  // Check 2: If a team is selected but not finalized, show the confirmation modal.
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

  // Check 3: Default view (selecting a team)
  return (
    <div className="team-assignment-overlay">
      <div className="team-assignment-modal compact">
        <h3>Assign Player</h3>
        <p className="assignment-player-name">{player.name}</p>
        
        {/* --- REVISED BID INPUT SECTION --- */}
        <div className="bid-input-compact">
          <label htmlFor="bid-amount">Current Bid (₹)</label>
          <div className="bid-control-group">
            <input
              id="bid-amount"
              type="number"
              min={player.basePrice || 0}
              value={bidPrice}
              // Allows manual entry, but prevents lowering below base price
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
          </div>
        </div>
        {/* --- END REVISED BID INPUT SECTION --- */}
        
        <div className="teams-grid-compact">
          {teams.map(team => {
            const budgetInsufficient = (teamBudgets[team.id] ?? teamBudgetLimit) < bidPrice;
            const invalidBid = bidPrice <= 0;
            const roleRestriction = !canTakePlayer(team);
            
            const isDisabled = budgetInsufficient || invalidBid || roleRestriction;
            
            let disableReason = '';
            if (budgetInsufficient) {
              disableReason = 'Insufficient budget';
            } else if (roleRestriction) {
              if (category === 'allrounders') {
                disableReason = 'Allrounder limit reached';
              } else if (category === 'allrounders-1') {
                disableReason = 'Allrounders-1 limit reached';
              } else if (category === 'allrounders-p') {
                disableReason = 'Allrounders-P limit reached';
              } else {
                disableReason = 'Role limit reached';
              }
            }
            
            return (
              <button
                key={team.id}
                className={`team-card-compact ${isDisabled ? 'disabled' : ''}`}
                // Use the new tentative assign handler
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
      </div>
    </div>
  );
}

export default TeamAssignment;