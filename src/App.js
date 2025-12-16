import React, { useState } from 'react';
import './App.css';
import DataSetup from './components/DataSetup';
import AuctionArea from './components/AuctionArea';
import FinalOutput from './components/FinalOutput';

function App() {
  const TEAM_BUDGET_LIMIT = 100000; // per-team purse
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [assignedPlayers, setAssignedPlayers] = useState({}); // {playerId: {teamId, price}}
  const [teamBudgets, setTeamBudgets] = useState({}); // {teamId: remaining}
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [auctionStarted, setAuctionStarted] = useState(false);
  const [auctionComplete, setAuctionComplete] = useState(false);
  const [lastAssigned, setLastAssigned] = useState(null); // {playerId, teamId, price}

  const handleDataSetup = (playersData, teamsData) => {
    setPlayers(playersData);
    setTeams(teamsData);
    setAuctionStarted(true);
    
    // Pre-assign captains and vice-captains to their teams
    const preAssigned = {};
    teamsData.forEach(team => {
      // Find and assign captain
      const captain = playersData.find(p => 
        p.name.toLowerCase().trim() === team.captain.toLowerCase().trim()
      );
      if (captain) {
        preAssigned[captain.id] = { 
          teamId: team.id, 
          price: 0, 
          isPreAssigned: true 
        };
      }
      
      // Find and assign vice-captain if exists
      if (team.viceCaptain) {
        const viceCaptain = playersData.find(p => 
          p.name.toLowerCase().trim() === team.viceCaptain.toLowerCase().trim()
        );
        if (viceCaptain) {
          preAssigned[viceCaptain.id] = { 
            teamId: team.id, 
            price: 0, 
            isPreAssigned: true 
          };
        }
      }
    });
    
    setAssignedPlayers(preAssigned);
    const initialBudgets = teamsData.reduce((acc, team) => {
      acc[team.id] = TEAM_BUDGET_LIMIT;
      return acc;
    }, {});
    setTeamBudgets(initialBudgets);
    setAuctionComplete(false);
  };

  const handlePlayerAssigned = (playerId, teamId, bidPrice) => {
    setAssignedPlayers(prev => ({
      ...prev,
      [playerId]: { teamId, price: bidPrice }
    }));
    setTeamBudgets(prev => ({
      ...prev,
      [teamId]: Math.max(0, (prev[teamId] ?? TEAM_BUDGET_LIMIT) - bidPrice)
    }));
    setLastAssigned({ playerId, teamId, price: bidPrice });
    setCurrentPlayer(null);
  };

  const handleUndoAssignment = (playerId) => {
    const assignment = assignedPlayers[playerId];
    if (!assignment) return;

    // Restore budget
    setTeamBudgets(prev => ({
      ...prev,
      [assignment.teamId]: (prev[assignment.teamId] ?? 0) + assignment.price
    }));

    // Remove assignment
    setAssignedPlayers(prev => {
      const updated = { ...prev };
      delete updated[playerId];
      return updated;
    });

    setLastAssigned(null);
  };

  const handleAuctionComplete = () => {
    setAuctionComplete(true);
    setAuctionStarted(false);
  };

  const getUnassignedPlayers = () => {
    // Filter out players who are already assigned (including captains/VCs)
    return players.filter(player => !assignedPlayers[player.id]);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>ECL Cricket Season 4 - 2026</h1>
      </header>

      <main className="app-main">
        {!auctionStarted && !auctionComplete && (
          <DataSetup onDataSetup={handleDataSetup} />
        )}

        {auctionStarted && !auctionComplete && (
          <AuctionArea
            players={players}
            teams={teams}
            currentPlayer={currentPlayer}
            setCurrentPlayer={setCurrentPlayer}
            assignedPlayers={assignedPlayers}
            onPlayerAssigned={handlePlayerAssigned}
            onUndoAssignment={handleUndoAssignment}
            onAuctionComplete={handleAuctionComplete}
            unassignedPlayers={getUnassignedPlayers()}
            teamBudgets={teamBudgets}
            teamBudgetLimit={TEAM_BUDGET_LIMIT}
            lastAssigned={lastAssigned}
          />
        )}

        {auctionComplete && (
          <FinalOutput
            players={players}
            teams={teams}
            assignedPlayers={assignedPlayers}
            teamBudgets={teamBudgets}
            teamBudgetLimit={TEAM_BUDGET_LIMIT}
          />
        )}
      </main>
    </div>
  );
}

export default App;

