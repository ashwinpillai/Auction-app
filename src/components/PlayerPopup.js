import React, { useEffect, useState } from 'react';
import './PlayerPopup.css';

function PlayerPopup({ player, show }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show && player) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(false);
      }, 80);
    } else {
      setIsVisible(false);
      setIsAnimating(false);
    }
  }, [show, player]);

  if (!player || !show) return null;

  const roleColors = {
    'Batsman': '#e74c3c',
    'Bowler': '#3498db',
    'All-Rounder': '#9b59b6',
    'Wicket-Keeper': '#f39c12',
    'Batsman/Wicket-Keeper': '#e67e22'
  };

  const roleColor = roleColors[player.role] || '#ffd166';

  return (
    <div className={`player-popup ${isAnimating ? 'animating' : ''} ${isVisible ? 'show' : ''}`}>
      <div className="popup-glow"></div>
      <div className="popup-content">
        <div className="player-photo-container">
          {player.photo ? (
            <img 
              src={player.photo} 
              alt={player.name}
              className="player-photo"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
          ) : null}
          <div className="player-icon" style={{ display: player.photo ? 'none' : 'block' }}>🏏</div>
        </div>
        <h2 className="player-name">{player.name}</h2>
        <div className="player-role-display" style={{ color: roleColor }}>
          {player.role}
        </div>
        <div className="base-price-highlight">
          <span className="base-price-label">Base Price</span>
          <span className="base-price-value">₹{player.basePrice.toLocaleString('en-IN')}</span>
        </div>
        {player.category && (
          <div className="player-category-tag">
            Set: {player.category}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerPopup;