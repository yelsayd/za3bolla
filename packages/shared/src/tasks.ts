/** A curated TaskMaster-style brief the host can announce out loud. */
export interface TaskDefinition {
  id: string;
  /** Short name for browsing in the host UI. */
  title: string;
  /** Imperative task text the host reads to contestants. */
  brief: string;
  /** Optional scoring vibe, e.g. "fastest wins". */
  scoring?: string;
}

/**
 * Family-friendly living-room / kitchen / backyard tasks.
 * Original wording — inspired by the spirit of TaskMaster, not copied from any show or site.
 */
export const TASK_BANK: readonly TaskDefinition[] = [
  {
    id: "sock-pair-sprint",
    title: "Sock pair sprint",
    brief:
      "Grab a mixed pile of clean socks. Make as many matching pairs as you can.",
    scoring: "Most pairs wins",
  },
  {
    id: "spoon-balance-carry",
    title: "Spoon balance carry",
    brief:
      "Balance a spoon on your nose, then walk to a marked spot and back without dropping it.",
    scoring: "Fastest clean run wins",
  },
  {
    id: "kitchen-orchestra",
    title: "Kitchen orchestra",
    brief:
      "Using only safe kitchen items as instruments, perform a 20-second song the room can recognize.",
    scoring: "Best performance wins",
  },
  {
    id: "blindfold-fruit-guess",
    title: "Blindfold fruit guess",
    brief:
      "Wear a blindfold. Identify three pieces of fruit by smell and touch only — no peeking.",
    scoring: "Most correct guesses wins",
  },
  {
    id: "newspaper-tower",
    title: "Newspaper tower",
    brief:
      "Build the tallest freestanding tower you can using only newspaper and tape. It must stand for five seconds.",
    scoring: "Tallest standing tower wins",
  },
  {
    id: "silent-movie-scene",
    title: "Silent movie scene",
    brief:
      "Act out a familiar movie or book scene without speaking. Everyone else must guess what it is.",
    scoring: "Fastest correct guess from the audience wins for the actor",
  },
  {
    id: "cup-pyramid-race",
    title: "Cup pyramid race",
    brief:
      "Stack disposable cups into a pyramid, then take it apart and restack it again.",
    scoring: "Fastest complete rebuild wins",
  },
  {
    id: "alphabet-pantry",
    title: "Alphabet pantry",
    brief:
      "Name one food item for every letter of the alphabet, in order. Skip nothing.",
    scoring: "Furthest without a stumble wins",
  },
  {
    id: "balloon-keep-up",
    title: "Balloon keep-up",
    brief:
      "Keep a balloon in the air using only your hands. If it touches the floor, you are done.",
    scoring: "Longest time aloft wins",
  },
  {
    id: "shoe-shuffle-lineup",
    title: "Shoe shuffle lineup",
    brief:
      "Everyone tosses one shoe into a pile. Sort the pile into a neat rainbow from lightest to darkest.",
    scoring: "Fastest accurate sort wins",
  },
  {
    id: "one-breath-joke",
    title: "One-breath joke",
    brief:
      "Tell a complete joke in a single breath. If you inhale mid-joke, start over.",
    scoring: "Best joke that fits in one breath wins",
  },
  {
    id: "couch-cushion-fort",
    title: "Couch cushion fort",
    brief:
      "Build a fort big enough for one person to sit inside using only cushions and blankets from this room.",
    scoring: "Most impressive fort wins",
  },
  {
    id: "drawing-telephone",
    title: "Drawing telephone",
    brief:
      "Secretly draw a simple object. Pass it along: each person redraws from the previous sketch. Reveal the chain.",
    scoring: "Closest final drawing to the original wins",
  },
  {
    id: "plastic-bag-race",
    title: "Plastic bag race",
    brief:
      "Put both feet in one empty plastic shopping bag and race to the finish line without tearing it.",
    scoring: "Fastest without a tear wins",
  },
  {
    id: "memory-tray",
    title: "Memory tray",
    brief:
      "Study a tray of household objects for thirty seconds. Cover it. Write down everything you remember.",
    scoring: "Most correctly recalled items wins",
  },
  {
    id: "paper-plane-distance",
    title: "Paper plane distance",
    brief:
      "Fold one paper airplane from a single sheet. Throw it once down a clear path.",
    scoring: "Farthest fair throw wins",
  },
  {
    id: "whisper-chain",
    title: "Whisper chain",
    brief:
      "The host whispers a silly sentence to the first player. Pass it ear-to-ear down the line, then say it aloud.",
    scoring: "Closest to the original sentence wins",
  },
  {
    id: "laundry-basket-toss",
    title: "Laundry basket toss",
    brief:
      "From a marked line, toss rolled-up socks into a laundry basket. Take five throws each.",
    scoring: "Most baskets wins",
  },
  {
    id: "statue-freeze",
    title: "Statue freeze",
    brief:
      "Strike a dramatic pose when the host says “freeze.” Hold still while the host walks the room looking for wobbles.",
    scoring: "Last statue still standing wins",
  },
  {
    id: "ingredient-rhyme-chef",
    title: "Ingredient rhyme chef",
    brief:
      "Invent a three-ingredient snack recipe where every ingredient name rhymes with the others. Present it with flair.",
    scoring: "Most creative (and rhyming) recipe wins",
  },
  {
    id: "count-up-together",
    title: "Count up together",
    brief:
      "As a group, count upward one number at a time, taking turns around the circle. On odd numbers, clap once. On even numbers, hop once. Anyone who hesitates, skips a number, or mixes up the action is out. Keep going until only one player remains — or until you hit twenty.",
    scoring: "Last player still in wins",
  },
] as const;

export function getTaskById(id: string): TaskDefinition | undefined {
  return TASK_BANK.find((task) => task.id === id);
}
