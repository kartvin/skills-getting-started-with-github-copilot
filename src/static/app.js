document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and list
      activitiesList.innerHTML = "";

      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        if (spotsLeft <= 0) activityCard.classList.add("full");

        // Title
        const title = document.createElement("h4");
        title.textContent = name;

        // Description
        const desc = document.createElement("p");
        desc.textContent = details.description;

        // Schedule
        const schedule = document.createElement("p");
        const schedLabel = document.createElement("strong");
        schedLabel.textContent = "Schedule:";
        schedule.appendChild(schedLabel);
        schedule.appendChild(document.createTextNode(` ${details.schedule}`));

        // Availability
        const availability = document.createElement("p");
        const availLabel = document.createElement("strong");
        availLabel.textContent = "Availability:";
        availability.appendChild(availLabel);
        availability.appendChild(document.createTextNode(` ${spotsLeft} spots left`));

        activityCard.appendChild(title);
        activityCard.appendChild(desc);
        activityCard.appendChild(schedule);
        activityCard.appendChild(availability);

        // Participants section
        const participantsLabel = document.createElement("p");
        const participantsStrong = document.createElement("strong");
        participantsStrong.textContent = "Participants:";
        participantsLabel.appendChild(participantsStrong);

        const ul = document.createElement("ul");
        ul.className = "participants";

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          details.participants.forEach((email) => {
            const li = document.createElement("li");
            li.className = "participant";

            const avatar = document.createElement("span");
            avatar.className = "participant-avatar";
            const local = email.split("@")[0];
            const initials = local
              .split(/[^a-zA-Z0-9]/)
              .filter(Boolean)
              .map((s) => s[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            avatar.textContent = initials || "?";

            const text = document.createElement("span");
            text.className = "participant-text";
            text.textContent = email;
            text.title = email;

            li.appendChild(avatar);
            li.appendChild(text);
            ul.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.className = "participants-empty";
          li.textContent = "No participants yet";
          ul.appendChild(li);
        }

        activityCard.appendChild(participantsLabel);
        activityCard.appendChild(ul);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown (disable if full)
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name + (spotsLeft <= 0 ? " (Full)" : "");
        option.disabled = spotsLeft <= 0;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitBtn = signupForm.querySelector('button[type="submit"]');
    const email = document.getElementById("email").value.trim();
    const activity = document.getElementById("activity").value;

    if (!activity) {
      messageDiv.textContent = "Please select an activity.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
      return;
    }

    submitBtn.disabled = true;
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();

        // refresh activities to show updated availability and participants
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      console.error("Error signing up:", error);
    } finally {
      submitBtn.disabled = false;
      messageDiv.classList.remove("hidden");
      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    }
  });

  // Initialize app
  fetchActivities();
});
