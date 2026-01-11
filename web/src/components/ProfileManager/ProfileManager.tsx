import { useState } from 'react';
import type { SessionProfile } from '../../hooks/useProfiles';
import type { SerialConfig } from '../../types/serial';

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
    <div className="mt-3">
      <div className="flex gap-2">
        <button
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#3c3c3c] text-slate-300 border border-[#555] rounded transition-all text-xs hover:bg-[#464646] hover:border-[#666]"
          onClick={() => setShowProfileList(!showProfileList)}
          title="Load saved profile"
        >
          <span className="material-symbols-outlined text-[16px]">folder_open</span>
          <span>Profiles ({profiles.length})</span>
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#3c3c3c] text-slate-300 border border-[#555] rounded transition-all text-xs hover:bg-[#464646] hover:border-[#666] disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => setShowSaveDialog(true)}
          disabled={!currentConfig}
          title="Save current configuration as profile"
        >
          <span className="material-symbols-outlined text-[16px]">save</span>
          <span>Save Profile</span>
        </button>
      </div>

      {showSaveDialog && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[2000] animate-[fadeIn_0.2s]"
          onClick={() => setShowSaveDialog(false)}
        >
          <div
            className="bg-[#2d2d2d] border border-[#555] rounded-md p-5 min-w-[400px] shadow-[0_8px_24px_rgba(0,0,0,0.5)] animate-[slideUp_0.2s]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="m-0 mb-4 text-slate-200 text-base">Save Profile</h3>
            <input
              type="text"
              className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#555] rounded text-slate-200 text-sm outline-none box-border focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Profile name..."
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setShowSaveDialog(false);
              }}
              autoFocus
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={handleSave}
                disabled={!profileName.trim()}
                className="px-4 py-1.5 bg-primary border border-primary rounded cursor-pointer text-xs text-white transition-all hover:bg-[#1177bb] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-1.5 bg-[#3c3c3c] text-slate-300 border border-[#555] rounded cursor-pointer text-xs transition-all hover:bg-[#464646]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfileList && profiles.length > 0 && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[2000] animate-[fadeIn_0.2s]"
          onClick={() => setShowProfileList(false)}
        >
          <div
            className="bg-[#2d2d2d] border border-[#555] rounded-md min-w-[500px] max-w-[700px] max-h-[80vh] shadow-[0_8px_24px_rgba(0,0,0,0.5)] animate-[slideUp_0.2s] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-[#3c3c3c]">
              <h3 className="m-0 text-slate-200 text-base">Saved Profiles</h3>
              <button
                className="bg-transparent border-none text-slate-400 cursor-pointer text-xl p-0 w-6 h-6 flex items-center justify-center transition-colors hover:text-slate-200"
                onClick={() => setShowProfileList(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="overflow-y-auto p-2">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex justify-between items-center p-3 px-4 bg-[#252525] border border-[#3c3c3c] rounded mb-2 transition-all hover:bg-[#2d2d2d] hover:border-[#555]"
                >
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-200 mb-1">{profile.name}</div>
                    <div className="text-xs text-slate-400 mb-0.5">
                      {profile.config.port} @ {profile.config.baud_rate} baud
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Created: {formatDate(profile.createdAt)}
                      {profile.lastUsed && (
                        <> • Last used: {formatDate(profile.lastUsed)}</>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1.5 bg-primary border border-primary rounded cursor-pointer text-xs text-white transition-all hover:bg-[#1177bb]"
                      onClick={() => handleLoad(profile)}
                      title="Load this profile"
                    >
                      Load
                    </button>
                    <button
                      className="px-3 py-1.5 bg-[#3c3c3c] text-slate-300 border border-[#555] rounded cursor-pointer text-xs transition-all hover:bg-red-700 hover:border-red-700"
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
