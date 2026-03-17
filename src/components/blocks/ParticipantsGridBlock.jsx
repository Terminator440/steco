import { withSupabaseImageParams } from "../../lib/imageUtils";

export function ParticipantsGridBlock({ data }) {
  const heading = data?.heading || "Participanți";
  const participants = data?.participants || [];

  if (!participants.length) {
    return (
      <section className="mx-auto max-w-4xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-3xl p-6 text-center text-sm text-slate-300">
          Nu sunt participanți adăugați încă.
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mb-6 text-center">
        <h2 className="font-display text-2xl text-slate-50 sm:text-3xl">{heading}</h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {participants.map((participant, idx) => {
          const photoUrl = participant?.photoUrl
            ? withSupabaseImageParams(participant.photoUrl, { width: 420, quality: 80 })
            : "";

          return (
            <article
              key={participant.id || idx}
              className="glass-panel flex flex-col items-center rounded-2xl p-5 text-center"
            >
              <div className="mb-3 flex justify-center">
                <div className="relative aspect-square w-24 overflow-hidden rounded-full border border-slate-700 bg-slate-900/80">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 scale-110 bg-gradient-to-br from-slate-100/40 to-slate-500/40 blur-xl"
                  />
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={participant.name || "Participant"}
                      width="240"
                      height="240"
                      loading="lazy"
                      decoding="async"
                      className="relative z-10 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="relative z-10 flex h-full w-full items-center justify-center text-xs text-slate-400">
                      Fără fotografie
                    </div>
                  )}
                </div>
              </div>
              <h3 className="text-sm font-semibold text-slate-50 sm:text-base">
                {participant.name || "Participant fără nume"}
              </h3>
            </article>
          );
        })}
      </div>
    </section>
  );
}

