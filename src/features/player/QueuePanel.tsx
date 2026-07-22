import { X } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { useCatalogStore } from '@/stores/catalogStore';

export function QueuePanel({ onClose }: { onClose: () => void }) {
  const queue = usePlayerStore((s) => s.queue);
  const currentSongId = usePlayerStore((s) => s.currentSongId);
  const playSong = usePlayerStore((s) => s.playSong);
  const remove = usePlayerStore((s) => s.removeFromQueue);

  const songs = useCatalogStore((s) => s.songs);

  return (
    <div
      className="
        fixed
        right-4
        bottom-20
        z-50
        w-80
        rounded-xl
        border
        border-border
        bg-surface
        p-4
        shadow-xl
      "
    >
      <div className="mb-3 flex justify-between">
        <h3 className="font-bold">صف پخش</h3>

        <button onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="space-y-2">
        {queue.map((id) => {
          const song = songs.find((s) => s.id === id);

          if (!song) return null;

          return (
            <div
              key={id}
              className="
                flex
                items-center
                justify-between
                rounded-lg
                p-2
                hover:bg-surface-2
              "
            >
              <button className="truncate text-sm" onClick={() => playSong(id, queue)}>
                {song.title}
                {id === currentSongId && ' ▶'}
              </button>

              <button className="text-xs text-red-400" onClick={() => remove(id)}>
                حذف
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
