import { useState } from 'react';
import type { SessionProfile } from '../../hooks/useProfiles';
import type { SerialConfig } from '../../types/serial';
import './ProfileManager.css';

interface ProfileManagerProps {
  profiles: SessionProfile[];
  onSaveProfile: (name: string, config: SerialConfig) => void;
  onLoadProfile: (profile: SessionProfile) => void;
  onDeleteProfile: (id: string) => void;
  currentConfig: SerialConfig | null;
}

export function ProfileManager({
  profiles,
  onSaveProfile,
  onLoadProfile,
  onDeleteProfile,
  currentConfig,
}: ProfileManagerProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showProfileList, setShowProfileList] = useState(false);
  const [profileName, setProfileName] = useState('');

  const handleSave = () => {
    if (!currentConfig || !profileName.trim()) return;

    onSaveProfile(profileName.trim(), currentConfig);
    setProfileName('');
    setShowSaveDialog(false);
  };

  const handleLoad = (profile: SessionProfile) => {
    onLoadProfile(profile);
    setShowProfileList(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="profile-manager">
      <div className="profile-buttons">
        <button
          className="profile-btn"
          onClick={() => setShowProfileList(!showProfileList)}
          title="Load saved profile"
        >
          📂 Profiles ({profiles.length})
        </button>
        <button
          className="profile-btn"
          onClick={() => setShowSaveDialog(true)}
          disabled={!currentConfig}
          title="Save current configuration as profile"
        >
          💾 Save Profile
        </button>
      </div>

      {showSaveDialog && (
        <div className="profile-dialog-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="profile-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Save Profile</h3>
            <input
              type="text"
              className="profile-input"
              placeholder="Profile name..."
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setShowSaveDialog(false);
              }}
              autoFocus
            />
            <div className="profile-dialog-buttons">
              <button onClick={handleSave} disabled={!profileName.trim()}>
                Save
              </button>
              <button onClick={() => setShowSaveDialog(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showProfileList && profiles.length > 0 && (
        <div className="profile-list-overlay" onClick={() => setShowProfileList(false)}>
          <div className="profile-list" onClick={(e) => e.stopPropagation()}>
            <div className="profile-list-header">
              <h3>Saved Profiles</h3>
              <button
                className="profile-close"
                onClick={() => setShowProfileList(false)}
              >
                ✕
              </button>
            </div>
            <div className="profile-items">
              {profiles.map((profile) => (
                <div key={profile.id} className="profile-item">
                  <div className="profile-info">
                    <div className="profile-name">{profile.name}</div>
                    <div className="profile-details">
                      {profile.config.port} @ {profile.config.baud_rate} baud
                    </div>
                    <div className="profile-date">
                      Created: {formatDate(profile.createdAt)}
                      {profile.lastUsed && (
                        <> • Last used: {formatDate(profile.lastUsed)}</>
                      )}
                    </div>
                  </div>
                  <div className="profile-actions">
                    <button
                      className="profile-action-btn load"
                      onClick={() => handleLoad(profile)}
                      title="Load this profile"
                    >
                      Load
                    </button>
                    <button
                      className="profile-action-btn delete"
                      onClick={() => onDeleteProfile(profile.id)}
                      title="Delete this profile"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
