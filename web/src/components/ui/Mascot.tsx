
const POSES: Record<string, string> = {
  idle: "Idle.png",
  phone: "Working.png",
  worried: "Worried.png",
  sad: "Sad.png",
  celebrating: "Celebrating.png",
  celebrate: "Celebrating.png",
  cheer: "Happy-Rejoicing.png",
  delight: "Happy.png",
  sleep: "Sleeping.png",
  read: "Board.png",
  talk: "Waving.png",
  rest: "Relaxed.png",
  ledger: "Working.png",
  coin: "Coin.png",
  shy: "Curios.png",
  note: "Curios.png",
  save: "Working.png",
  guard: "Guard-Shield.png",
  shield: "Guard-Shield.png",
  peek: "Leaf-Hello.png",
  bankHappy: "Bank-Happy.png",
  board: "Board.png",
  curios: "Curios.png",
  guardShield: "Guard-Shield.png",
  happy: "Happy.png",
  happyRejoicing: "Happy-Rejoicing.png",
  leafHello: "Leaf-Hello.png",
  relaxed: "Relaxed.png",
  sadder: "Sadder.png",
  sittingIdle: "Sitting-Idle.png",
  sleeping: "Sleeping.png",
  waving: "Waving.png",
  working: "Working.png",
};

export type MascotPose = keyof typeof POSES;

interface MascotProps {
  pose?: MascotPose;
  size?: number;
  className?: string;
  label?: string;
}

export function Mascot({ pose = "idle", size = 128, className = "", label }: MascotProps) {
  const src = POSES[pose] ?? POSES.idle;
  return (
    <figure aria-hidden={!label} aria-label={label} className={`shrink-0 ${className}`} style={{ width: size, height: size }}>
      <img
        src={`/mascot/ultra-refined/${src}`}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className="block h-full w-full object-contain"
      />
    </figure>
  );
}
