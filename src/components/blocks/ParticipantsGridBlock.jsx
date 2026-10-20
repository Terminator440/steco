import { withSupabaseImageParams } from "../../lib/imageUtils";

function initials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function ParticipantsGridBlock({ data }) {
  const heading = data?.heading || "Participanți";
  const participants = data?.participants || [];

  if (!participants.length) return null;

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <h2 className="type-h2 mb-12 sm:mb-16">{heading}</h2>

        <ul className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
          {participants.map((participant, idx) => {
            const photoUrl = participant?.photoUrl
              ? withSupabaseImageParams(participant.photoUrl, { width: 420, quality: 80 })
              : "";

            return (
              <li key={participant.id || idx} className="flex flex-col items-center text-center">
                <div className="aspect-square w-full max-w-[11rem] overflow-hidden rounded-full bg-blush">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt=""
                      width="240"
                      height="240"
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-full w-full items-center justify-center font-display text-[2.5rem] text-magenta"
                    >
                      {initials(participant.name) || "S"}
                    </span>
                  )}
                </div>
                <p className="mt-5 font-display text-[1.375rem] leading-tight text-ink">
                  {participant.name || "Invitat Steco"}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
