import { cn } from '../lib/cn';

interface RoomBreakdown {
  triple: number;
  double: number;
  quad: number;
}

interface KPICardsProps {
  totalPilgrims: number;
  makkahRooms: RoomBreakdown;
  madinahRooms: RoomBreakdown;
}

function RoomCard({
  city,
  rooms,
}: {
  city: string;
  rooms: RoomBreakdown;
}) {
  const total = rooms.triple + rooms.double + rooms.quad;
  return (
    <div
      className={cn(
        'kpi-surface rounded-card border px-[22px] py-[18px] shadow-card transition-[box-shadow,border-color] duration-150 hover:border-white/25 hover:shadow-[0_6px_28px_rgba(4,106,56,0.38)]',
      )}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span className="kpi-marker inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-white shadow-[0_0_0_2px_rgba(255,255,255,0.22)]" />
        <span className="kpi-label text-[11px] font-semibold tracking-wide !text-white/90 uppercase">
          عدد الغرف في {city}
        </span>
      </div>
      <div className="kpi-value mb-2 text-[clamp(2.125rem,4.2vw,2.875rem)] leading-none font-extrabold tracking-tight !text-white">
        {total.toLocaleString()}
      </div>
      <div className="flex flex-wrap gap-3">
        <span className="breakdown-item flex items-center gap-1.5 text-[11px] !text-white/90">
          <span className="dot dot-triple inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-white/95" />
          ثلاثي: <strong className="!text-white">{rooms.triple}</strong>
        </span>
        <span className="breakdown-item flex items-center gap-1.5 text-[11px] !text-white/90">
          <span className="dot dot-double inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-blue-200" />
          ثنائي: <strong className="!text-white">{rooms.double}</strong>
        </span>
        <span className="breakdown-item flex items-center gap-1.5 text-[11px] !text-white/90">
          <span className="dot dot-quad inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-amber-300" />
          رباعي: <strong className="!text-white">{rooms.quad}</strong>
        </span>
      </div>
    </div>
  );
}

export function KPICards({ totalPilgrims, makkahRooms, madinahRooms }: KPICardsProps) {
  return (
    <div className="kpi-row grid grid-cols-3 gap-[14px] max-md:grid-cols-1">
      <div
        className={cn(
          'kpi-surface rounded-card border px-[22px] py-[18px] shadow-card transition-[box-shadow,border-color] duration-150 hover:border-white/25 hover:shadow-[0_6px_28px_rgba(4,106,56,0.38)]',
        )}
      >
        <div className="mb-1.5 flex items-center gap-2">
          <span className="kpi-marker inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-white shadow-[0_0_0_2px_rgba(255,255,255,0.22)]" />
          <span className="kpi-label text-[11px] font-semibold tracking-wide !text-white/90 uppercase">إجمالي الحجاج</span>
        </div>
        <div className="kpi-value text-[clamp(2.125rem,4.2vw,2.875rem)] leading-none font-extrabold tracking-tight !text-white">
          {totalPilgrims.toLocaleString()}
        </div>
      </div>
      <RoomCard city="مكة" rooms={makkahRooms} />
      <RoomCard city="المدينة" rooms={madinahRooms} />
    </div>
  );
}
