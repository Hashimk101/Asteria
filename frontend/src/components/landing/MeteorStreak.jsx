import { useEffect, useState, useCallback } from "react";

// Generate all random values here — outside render, pure data
function createStreak(id) {
  return {
    id,
    top:      10  + Math.random() * 38,
    length:   120 + Math.random() * 160,   // thicker/longer
    angle:    18  + Math.random() * 14,
    duration: 2.2 + Math.random() * 1.2,
  };
}

function Streak({ streak, onDone }) {
  const { id, top, length, angle, duration } = streak;

  useEffect(() => {
    const t = setTimeout(() => onDone(id), duration * 1000 + 300);
    return () => clearTimeout(t);
  }, [id, onDone, duration]);

  return (
    <div style={{
      position:      "absolute",
      top:           `${top}%`,
      left:          "-260px",
      zIndex:        15,
      animation:     `meteor-fly ${duration}s linear forwards`,
      pointerEvents: "none",
    }}>
      {/* Tail — thicker, amber-orange theme */}
      <div style={{
        width:           `${length}px`,
        height:          "3px",
        background:      "linear-gradient(to right, transparent, rgba(196,140,64,0.4), rgba(220,170,80,0.9), #f0c060)",
        transform:       `rotate(${angle}deg)`,
        transformOrigin: "left center",
        boxShadow:       "0 0 8px rgba(220,170,80,0.6), 0 0 16px rgba(196,140,64,0.3)",
        borderRadius:    "2px",
      }} />

      {/* Soft glow halo behind head */}
      <div style={{
        position:     "absolute",
        right:        "-2px",
        top:          "50%",
        transform:    `translateY(-50%) rotate(${angle}deg)`,
        width:        "14px",
        height:       "14px",
        borderRadius: "50%",
        background:   "radial-gradient(circle, rgba(240,200,80,0.5) 0%, transparent 70%)",
        filter:       "blur(3px)",
      }} />

      {/* Head dot */}
      <div style={{
        position:     "absolute",
        right:        0,
        top:          "50%",
        transform:    "translateY(-50%)",
        width:        "5px",
        height:       "5px",
        borderRadius: "50%",
        background:   "#f5d060",
        boxShadow:    "0 0 10px rgba(240,200,80,0.9), 0 0 20px rgba(196,140,64,0.5)",
      }} />
    </div>
  );
}

export default function MeteorStreaks() {
  const [streaks, setStreaks] = useState([]);

  useEffect(() => {
    let timeoutId;
    const schedule = () => {
      const delay = 3500 + Math.random() * 5000;
      timeoutId = setTimeout(() => {
        // All random values created here — never inside render
        setStreaks(prev => [...prev, createStreak(Date.now())]);
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timeoutId);
  }, []);

  const remove = useCallback(
    (id) => setStreaks(prev => prev.filter(s => s.id !== id)),
    []
  );

  return (
    <div style={{
      position:      "absolute",
      inset:         0,
      overflow:      "hidden",
      pointerEvents: "none",
      zIndex:        15,
    }}>
      {streaks.map(streak => (
        <Streak key={streak.id} streak={streak} onDone={remove} />
      ))}
    </div>
  );
}
