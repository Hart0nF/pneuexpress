"use client";

import { useState } from "react";
import { format, startOfWeek, addDays, addWeeks } from "date-fns";
import { fr } from "date-fns/locale/fr";

export default function WeekCalendar({
  onSelectDate,
}: {
  onSelectDate: (date: Date) => void;
}) {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Génère UNIQUEMENT lundi → vendredi
  const days = [...Array(5)].map((_, i) => addDays(currentWeekStart, i));

  const nextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const prevWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, -1));

  return (
    <div style={{ textAlign: "center" }}>
      {/* Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "10px",
          alignItems: "center",
        }}
      >
        <button onClick={prevWeek}>Précédent</button>
        <h3>Semaine du {format(currentWeekStart, "d MMMM", { locale: fr })}</h3>
        <button onClick={nextWeek}>Suivante</button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          padding: "10px",
        }}
      >
        {days.map((day) => (
          <button className="btncal"
            key={day.toISOString()}
            style={{
              border: "2px solid black",
              padding: "10px",
              cursor: "pointer",
              width: "120px",
              color: "white",
              borderRadius:"1rem"
            }}
            onClick={() => onSelectDate(day)}
          >
            <div style={{ fontWeight: "bold" }}>
              {format(day, "EEEE", { locale: fr })}
            </div>
            <div>{format(day, "d MMM", { locale: fr })}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
