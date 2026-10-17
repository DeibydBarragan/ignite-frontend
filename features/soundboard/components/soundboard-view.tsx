"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useSoundboard } from "@/context/soundboard-context";
import type { SoundItem, SoundCategory } from "@/types/domain";
import { AddSoundModal } from "./add-sound-modal";
import { EditSoundModal } from "./edit-sound-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SoundPad } from "./sound-pad";
import { SoundboardToolbar, type SoundScope, type SoundSort } from "./soundboard-toolbar";
import { ActivityFeed } from "./activity-feed";
import { Volume2, Plus, Trash2 } from "lucide-react";

export function SoundboardView() {
  const { user } = useAuth();
  const { sounds, activeSoundId, playSound, attachSoundAudio, deleteCustomSound } = useSoundboard();

  const [searchSound, setSearchSound] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | SoundCategory>("all");
  const [soundScope, setSoundScope] = useState<SoundScope>("all");
  const [sortBy, setSortBy] = useState<SoundSort>("recent");
  const [isAddSoundOpen, setIsAddSoundOpen] = useState(false);
  const [editingSound, setEditingSound] = useState<SoundItem | null>(null);
  const [deletingSound, setDeletingSound] = useState<SoundItem | null>(null);
  const [isAttaching, setIsAttaching] = useState(false);
  const [attachingSoundId, setAttachingSoundId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const attachTargetRef = useRef<string | null>(null);

  const ATTACH_EXTS = [".mp3", ".ogg", ".oga", ".wav", ".webm", ".m4a"];
  const ATTACH_MAX_BYTES = 5 * 1024 * 1024;

  const triggerAttach = (soundId: string) => {
    attachTargetRef.current = soundId;
    fileInputRef.current?.click();
  };

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const targetId = attachTargetRef.current;
    attachTargetRef.current = null;
    if (!file || !targetId || isAttaching) return;

    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!ATTACH_EXTS.includes(ext)) return;
    if (file.size > ATTACH_MAX_BYTES) return;

    setIsAttaching(true);
    setAttachingSoundId(targetId);
    try {
      await attachSoundAudio(targetId, file);
    } finally {
      setIsAttaching(false);
      setAttachingSoundId(null);
    }
  };

  const isSoundMine = useCallback(
    (s: SoundItem): boolean => {
      if (!s.uploadedBy || s.uploadedBy.trim() === "" || s.uploadedBy === "null") return false;
      const uid = s.uploadedBy.trim();
      if (uid === "local-user" || uid === "750899475404292126") return true;
      if (user?.id && uid === user.id) return true;
      if (!user) return true;
      return false;
    },
    [user]
  );

  const mySounds = useMemo(() => {
    return sounds.filter(isSoundMine);
  }, [sounds, isSoundMine]);

  const publicSounds = useMemo(() => {
    return sounds.filter((s) => !isSoundMine(s));
  }, [sounds, isSoundMine]);

  const scopeSounds = useMemo(() => {
    if (soundScope === "mine") return mySounds;
    if (soundScope === "public") return publicSounds;
    return sounds;
  }, [soundScope, mySounds, publicSounds, sounds]);

  const filteredSounds = useMemo(() => {
    const list = scopeSounds.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchSound.toLowerCase());
      const matchesCat = selectedCategory === "all" || s.category === selectedCategory;
      return matchesSearch && matchesCat;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "recent") {
        const timeA = a.lastPlayedAt ?? 0;
        const timeB = b.lastPlayedAt ?? 0;
        if (timeA !== timeB) return timeB - timeA;
        if ((b.playsCount ?? 0) !== (a.playsCount ?? 0)) {
          return (b.playsCount ?? 0) - (a.playsCount ?? 0);
        }
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "popular") {
        if ((b.playsCount ?? 0) !== (a.playsCount ?? 0)) {
          return (b.playsCount ?? 0) - (a.playsCount ?? 0);
        }
        return (b.lastPlayedAt ?? 0) - (a.lastPlayedAt ?? 0);
      }
      if (sortBy === "alpha") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [scopeSounds, searchSound, selectedCategory, sortBy]);

  const isFilterEmpty = !searchSound && selectedCategory === "all";

  return (
    <div className="space-y-8">
      {/* ═══════════════════ PARTE 1: CATÁLOGO DE SOUNDBOARD ═══════════════════ */}
      <section className="space-y-4">
        <SoundboardToolbar
          search={searchSound}
          onSearchChange={setSearchSound}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          scope={soundScope}
          onScopeChange={setSoundScope}
          sortBy={sortBy}
          onSortChange={setSortBy}
          counts={{ all: sounds.length, mine: mySounds.length, public: publicSounds.length }}
          onAddSound={() => setIsAddSoundOpen(true)}
        />

        {/* MPC Audio Sampler Grid */}
        {filteredSounds.length === 0 ? (
          <div className="p-12 text-center glass-panel border border-dashed border-black/10 dark:border-white/10">
            <Volume2 size={36} className="mx-auto text-purple-400/40 mb-3" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {soundScope === "mine" && isFilterEmpty
                ? "Aún no tienes sonidos propios"
                : soundScope === "public" && isFilterEmpty
                ? "No hay sonidos comunitarios"
                : "Sin resultados"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              {soundScope === "mine" && isFilterEmpty
                ? "Usa «Añadir sonido» con un .mp3 o edita uno existente y márcalo como «Propio»."
                : soundScope === "public" && isFilterEmpty
                ? "Los sonidos de serie o marcados como «De todos» aparecerán aquí."
                : "Prueba con otro nombre o categoría."}
            </p>
            {soundScope === "mine" && isFilterEmpty && (
              <button
                onClick={() => setIsAddSoundOpen(true)}
                className="mt-4 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={13} />
                <span>Subir mi primer sonido</span>
              </button>
            )}
          </div>
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {filteredSounds.map((snd) => (
            <SoundPad
              key={snd.id}
              sound={snd}
              isPlaying={activeSoundId === snd.id}
              isMine={isSoundMine(snd)}
              showMineBadge={soundScope === "all"}
              isAttachingAny={isAttaching}
              attachingSoundId={attachingSoundId}
              onPlay={() => playSound(snd.id)}
              onEdit={() => setEditingSound(snd)}
              onAttach={() => triggerAttach(snd.id)}
              onDelete={() => setDeletingSound(snd)}
            />
          ))}
        </div>
        )}
      </section>

      {/* ═══════════════════ PARTE 2: ACTIVIDAD ═══════════════════ */}
      <ActivityFeed />

      {/* Modals */}
      <AddSoundModal isOpen={isAddSoundOpen} onClose={() => setIsAddSoundOpen(false)} />
      <EditSoundModal
        key={editingSound?.id ?? "none"}
        sound={editingSound}
        onClose={() => setEditingSound(null)}
      />
      <ConfirmDialog
        isOpen={!!deletingSound}
        onClose={() => setDeletingSound(null)}
        onConfirm={async () => {
          if (!deletingSound) return;
          const ok = await deleteCustomSound(deletingSound.id);
          if (ok) setDeletingSound(null);
        }}
        maxWidth="md"
        icon={<Trash2 size={20} className="text-rose-500" />}
        title="Eliminar sonido"
        subtitle={deletingSound ? `¿Seguro que deseas eliminar «${deletingSound.name}»?` : undefined}
        confirmText="Eliminar definitivamente"
        confirmVariant="danger"
        confirmIcon={<Trash2 size={14} />}
      >
        {deletingSound && (
          <div className="p-3.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center text-2xl shrink-0">
              {deletingSound.emoji ? deletingSound.emoji : <Volume2 size={22} className="text-purple-400" />}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {deletingSound.name}
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="capitalize">{deletingSound.category}</span>
                <span>·</span>
                <span className={deletingSound.uploadedBy ? "text-emerald-500 font-semibold" : "text-purple-400 font-semibold"}>
                  {deletingSound.uploadedBy ? "Propio" : "De todos"}
                </span>
              </div>
            </div>
          </div>
        )}
      </ConfirmDialog>

      {/* Hidden file picker for attaching MP3 audio to existing sounds */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.ogg,.oga,.wav,.webm,.m4a,audio/*"
        className="hidden"
        onChange={handleAttachFile}
      />
    </div>
  );
}
