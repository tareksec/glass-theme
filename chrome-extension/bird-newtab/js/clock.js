/* ============================================================
   Bird Neumorphic New Tab — Analog clock
   Batches all DOM writes per tick (reads are just Date getters,
   so there is no read/write interleaving that would force layout).
   ============================================================ */

export function initClock() {
  const hourHand = document.getElementById("hourHand");
  const minuteHand = document.getElementById("minuteHand");
  const secondHand = document.getElementById("secondHand");
  const dateValue = document.getElementById("dateValue");
  const dayValue = document.getElementById("dayValue");

  function updateClock() {
    const now = new Date();

    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const hourDeg = hours * 30 + minutes * 0.5;
    const minuteDeg = minutes * 6 + seconds * 0.1;
    const secondDeg = seconds * 6;

    // Batched writes: only `transform` (compositor-only, no layout/paint
    // cost) and two short text nodes change per tick.
    hourHand.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;
    minuteHand.style.transform = `translateX(-50%) rotate(${minuteDeg}deg)`;
    secondHand.style.transform = `translateX(-50%) rotate(${secondDeg}deg)`;

    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    dateValue.textContent = `${day}/${month}`;
    dayValue.textContent = now.toLocaleDateString(undefined, { weekday: "long" });
  }

  updateClock();
  setInterval(updateClock, 1000);
}
