import React, { useState } from 'react';
import Papa from 'papaparse';
import './DataSetup.css';

function DataSetup({ onDataSetup }) {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [playersFile, setPlayersFile] = useState(null);
  const [teamsFile, setTeamsFile] = useState(null);

  const handlePlayersFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPlayersFile(file);
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          // Normalize column headers to handle extra spaces/case differences
          const normalizeRow = (row) => {
            const normalized = {};
            Object.keys(row || {}).forEach((key) => {
              const normKey = String(key || '')
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '')
                .replace(/_/g, '');
              normalized[normKey] = row[key];
            });
            return normalized;
          };

          const playersData = results.data
            .map((row, index) => {
              const r = normalizeRow(row);
              const name = r.name || r.playername || '';
              const role = r.role || r.playerrole || '';
              const category = r.category || r.playercategory || r.set || '';
              const basePrice = r.baseprice ?? 0;
              const photo = r.photo || r.photourl || r.image || r.imageurl || '';

              const normCategory = String(category || role || '').trim().toLowerCase();

              return {
                id: `player-${index}`,
                name: String(name).trim(),
                role: String(role).trim(),
                category: normCategory,
                basePrice: parseFloat(basePrice) || 0,
                photo: String(photo).trim()
              };
            })
            .filter(player => player.name && player.role && player.basePrice > 0);
          setPlayers(playersData);
        },
        error: (error) => {
          alert('Error parsing CSV file: ' + error.message);
        }
      });
    }
  };

  const handleTeamsFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTeamsFile(file);
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const normalizeRow = (row) => {
            const normalized = {};
            Object.keys(row || {}).forEach((key) => {
              const normKey = String(key || '')
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '')
                .replace(/_/g, '');
              normalized[normKey] = row[key];
            });
            return normalized;
          };

          const teamsData = results.data
            .map((row, index) => {
              const r = normalizeRow(row);
              const name = r.teamname || r.team || '';
              const captain = r.captain || '';
              const viceCaptain = r.vicecaptain || r['vicecaptain'] || '';
              return {
                id: `team-${index}`,
                name: String(name).trim(),
                captain: String(captain).trim(),
                viceCaptain: String(viceCaptain).trim()
              };
            })
            .filter(team => team.name);

          setTeams(teamsData);
        },
        error: (error) => {
          alert('Error parsing teams CSV file: ' + error.message);
        }
      });
    }
  };

  const handleStartAuction = () => {
    if (players.length === 0) {
      alert('Please upload players CSV file');
      return;
    }
    if (teams.length === 0) {
      alert('Please upload teams CSV file');
      return;
    }
    onDataSetup(players, teams);
  };

  return (
    <div className="data-setup">
      <div className="setup-container">
        <h2>Data Setup</h2>
        
        <div className="upload-section">
          <div className="upload-box">
            <h3>Upload Players CSV</h3>
            <p>CSV should contain: Name, Role, Category, Base Price, Photo (optional)</p>
            <input
              type="file"
              accept=".csv"
              onChange={handlePlayersFileUpload}
              className="file-input"
            />
            {playersFile && (
              <div className="file-info">
                ✓ {playersFile.name} ({players.length} players loaded)
              </div>
            )}
          </div>

          <div className="upload-box">
            <h3>Upload Teams CSV</h3>
            <p>CSV should contain: Team Name, Captain, Vice Captain (optional)</p>
            <input
              type="file"
              accept=".csv"
              onChange={handleTeamsFileUpload}
              className="file-input"
            />
            {teamsFile && (
              <div className="file-info">
                ✓ {teamsFile.name} ({teams.length} teams loaded)
              </div>
            )}
          </div>
        </div>

        <button
          className="start-button"
          onClick={handleStartAuction}
          disabled={players.length === 0 || teams.length === 0}
        >
          Start Auction
        </button>
      </div>
    </div>
  );
}

export default DataSetup;