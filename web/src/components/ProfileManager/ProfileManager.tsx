import type { SessionProfile } from '../../hooks/useProfiles';
import { isSerialConfig, isSSHConfig } from '../../types/connection';

interface ProfileManagerProps {
  profiles: SessionProfile[];
  onLoadProfile: (profile: SessionProfile) => void;
  onDeleteProfile: (id: string) => void;
}

export function ProfileManager({
  profiles,
  onLoadProfile,
  onDeleteProfile,
}: ProfileManagerProps) {
  const getProfileDescription = (profile: SessionProfile): string => {
    if (isSerialConfig(profile.config)) {
      const { port, baud_rate } = profile.config.config;
      return `${port} @ ${baud_rate} baud`;
    } else if (isSSHConfig(profile.config)) {
      const { username, host, port } = profile.config.config;
      return `${username}@${host}:${port}`;
    }
    return 'Unknown configuration';
  };

  const getProfileTypeBadge = (profile: SessionProfile) => {
    const isSerial = isSerialConfig(profile.config);
    return (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
          isSerial
            ? 'bg-blue-900/30 text-blue-300 border border-blue-700'
            : 'bg-green-900/30 text-green-300 border border-green-700'
        }`}
      >
        {isSerial ? 'Serial' : 'SSH'}
      </span>
    );
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

  if (profiles.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        <span className="material-symbols-outlined text-[32px] mb-2 block opacity-50">
          folder_off
        </span>
        No saved profiles yet.
        <br />
        Use "Save as Profile" in the Connection tab to create one.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {profiles.map((profile) => (
        <div
          key={profile.id}
          className="p-3 bg-[#1e1e1e] border border-[#3c3c3c] rounded transition-all hover:border-[#555] cursor-pointer"
          onClick={() => onLoadProfile(profile)}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {getProfileTypeBadge(profile)}
                <span className="text-sm font-semibold text-slate-200">
                  {profile.name}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {getProfileDescription(profile)}
              </div>
            </div>
            <button
              className="px-2 py-1 bg-transparent text-slate-400 border-none rounded cursor-pointer text-xs transition-all hover:text-red-400 hover:bg-red-900/20"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteProfile(profile.id);
              }}
              title="Delete this profile"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span>Created: {formatDate(profile.createdAt)}</span>
            {profile.lastUsed && (
              <>
                <span>•</span>
                <span>Last used: {formatDate(profile.lastUsed)}</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
