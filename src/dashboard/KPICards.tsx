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
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-marker" />
        <span className="kpi-label">عدد الغرف في {city}</span>
      </div>
      <div className="kpi-value">{total.toLocaleString()}</div>
      <div className="kpi-breakdown">
        <span className="breakdown-item">
          <span className="dot dot-triple" />
          ثلاثي: <strong>{rooms.triple}</strong>
        </span>
        <span className="breakdown-item">
          <span className="dot dot-double" />
          ثنائي: <strong>{rooms.double}</strong>
        </span>
        <span className="breakdown-item">
          <span className="dot dot-quad" />
          رباعي: <strong>{rooms.quad}</strong>
        </span>
      </div>
    </div>
  );
}

export function KPICards({ totalPilgrims, makkahRooms, madinahRooms }: KPICardsProps) {
  return (
    <div className="kpi-row">
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-marker" />
          <span className="kpi-label">إجمالي الحجاج</span>
        </div>
        <div className="kpi-value">{totalPilgrims.toLocaleString()}</div>
      </div>
      <RoomCard city="مكة" rooms={makkahRooms} />
      <RoomCard city="المدينة" rooms={madinahRooms} />
    </div>
  );
}
