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
    <section data-header="light" className="bg-paper px-4 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[1400px]">
        <h2 className="display display-lg reveal mb-14 border-b border-line pb-10">{heading}</h2>

        <ul className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
          {participants.map((participant, idx) => {
            const photoUrl = participant?.photoUrl
              ? withSupabaseImageParams(participant.photoUrl, { width: 420, quality: 80 })
              : "";

            return (
              <li key={participant.id || idx} className="reveal flex flex-col items-center text-center">
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
                      className="display flex h-full w-full items-center justify-center text-[2.5rem] text-magenta"
                    >
                      {initials(participant.name) || "S"}
                    </span>
                  )}
                </div>
                <p className="display display-sm mt-5">
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
