import { useState } from 'react';
import { ListPlus } from 'lucide-react';
import { usePlaylistStore } from '@/stores/playlistStore';
import { useCurrentUser } from '@/stores/authStore';

interface AddToPlaylistMenuProps {
  songId: string;
}

export function AddToPlaylistMenu({ songId }: AddToPlaylistMenuProps) {
  const [open, setOpen] = useState(false);

  const user = useCurrentUser();

  const playlists = usePlaylistStore((state) => (user ? state.getByOwner(user.id) : []));

  const addSong = usePlaylistStore((state) => state.addSong);

  const removeSong = usePlaylistStore((state) => state.removeSong);

  if (!user) return null;

  return (
    <div className="relative z-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="
          rounded-lg
          p-2
          text-muted
          transition-colors
          hover:bg-surface-2
          hover:text-text
        "
        aria-label="playlist menu"
      >
        <ListPlus size={18} />
      </button>

      {open && (
        <div
          className="
                absolute
                left-0
                top-full
                z-50
                mt-2
                w-56
                max-w-[calc(100vw-1rem)]
                rounded-xl
                border
                border-border
                bg-white
                dark:bg-zinc-900
                p-2
                shadow-lg
            "
        >
          {playlists.length === 0 ? (
            <p className="p-3 text-sm text-muted">پلی لیستی پیدا نشد.</p>
          ) : (
            playlists.map((playlist) => {
              const exists = playlist.songIds.includes(songId);

              return (
                <button
                  key={playlist.id}
                  type="button"
                  onClick={() => {
                    if (exists) {
                      removeSong(playlist.id, songId);
                    } else {
                      addSong(playlist.id, songId);
                    }

                    setOpen(false);
                  }}
                  className="
                    flex
                    w-full
                    items-center
                    justify-between
                    rounded-lg
                    px-3
                    py-2
                    text-start
                    text-sm
                    text-text
                    hover:bg-surface-2
                  "
                >
                  <span className="truncate">{playlist.name}</span>

                  <span className="text-xs text-muted">{exists ? 'Remove' : 'Add'}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
