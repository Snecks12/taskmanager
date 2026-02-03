function updateClock() {
      const now = new Date();

      // Days of the week
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayName = days[now.getDay()];

      // Months
      const months = ["January","February","March","April","May","June","July",
                      "August","September","October","November","December"];
      const monthName = months[now.getMonth()];
      const dayNumber = now.getDate();

      // Time values
      let hours = now.getHours();
      let minutes = now.getMinutes();
      let seconds = now.getSeconds();

      // Format with leading zeros
      hours = hours.toString().padStart(2, '0');
      minutes = minutes.toString().padStart(2, '0');
      seconds = seconds.toString().padStart(2, '0');

      // Display
      document.getElementById("day").textContent = dayName;
      document.getElementById("date").textContent = `${monthName} ${dayNumber}`;
      document.getElementById("time").textContent = `${hours}:${minutes}:${seconds}`;
    }

    // Update every second
    setInterval(updateClock, 1000);

    // Run immediately on load
    updateClock();