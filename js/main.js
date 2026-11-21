initPortfolioIntro(); // Start the intro before other page initialization can delay its clock.

// Find the theme control and the browser chrome color setting.
const themeToggle = document.querySelector("#theme-toggle");
// Keep the document root as the single source of the active theme.
const themeRoot = document.documentElement;
// Read the theme-color meta element so the browser UI follows the page.
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
// Respect reduced-motion preferences when applying the short theme transition.
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
// Track the pending cleanup so rapid toggles cannot leave transitions enabled.
let themeSwitchTimer;
// Synchronize the switch's accessible name with the action it will perform.
function updateThemeToggle(isDark) {
  // Name the next theme rather than announcing the current one.
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
} // Finish the accessible theme-control update.
// Apply a new theme, persist it when possible, and update the browser chrome.
function setTheme(isDark) {
  // Cancel any earlier cleanup before restarting the transition window.
  window.clearTimeout(themeSwitchTimer);
  // Check whether this theme change may animate under the user's preference.
  const shouldAnimate = !reducedMotionQuery.matches;
  // Enable the scoped color transition only when motion is permitted.
  themeRoot.classList.toggle("theme-switching", shouldAnimate);
  // Apply the requested mode to the root element.
  themeRoot.classList.toggle("dark", isDark);
  // Update the action label to match the newly active mode.
  updateThemeToggle(isDark);
  // Match the browser's address bar and controls to the page background.
  themeColorMeta.setAttribute("content", isDark ? "#0B1220" : "#F4F7FA");
  // Store the explicit selection while allowing the page to work without storage.
  try {
    // Persist the active theme for the next visit.
    localStorage.setItem("theme", isDark ? "dark" : "light");
  } catch (error) {
    // Report blocked storage without preventing the visible theme from changing.
    console.warn("Theme preference could not be saved.", error);
  } // Finish safe theme persistence.
  // Remove the temporary transition class after its 200 ms window.
  if (shouldAnimate) {
    // Schedule transition cleanup and retain its ID for rapid-toggle handling.
    themeSwitchTimer = window.setTimeout(() => {
      // Restore normal hover behavior once the theme colors have settled.
      themeRoot.classList.remove("theme-switching");
    }, 200);
  } // Finish conditional transition cleanup.
} // Finish the theme update operation.
// Read the prepaint theme choice to synchronize the control before interaction.
const initialDarkTheme = themeRoot.classList.contains("dark");
// Set the correct accessible action name on the initial render.
updateThemeToggle(initialDarkTheme);
// Set the matching browser chrome color without animating the page load.
themeColorMeta.setAttribute("content", initialDarkTheme ? "#0B1220" : "#F4F7FA");
// Toggle themes from the single control shown in desktop and mobile navigation.
themeToggle.addEventListener("click", () => {
  // Invert the current root class so repeated activations always use live state.
  setTheme(!themeRoot.classList.contains("dark"));
  playUiInteractionSound();
});

const soundToggle = document.querySelector("#interaction-sound-toggle");
const soundToggleIcons = soundToggle.querySelectorAll("[data-sound-icon]");
let soundEnabled = true;
let uiAudioContext = null;
let activeUiOscillator = null;
let activeUiGain = null;
let uiAudioUnavailableWarningShown = false;
function setSoundEnabled(isEnabled) {
  soundEnabled = isEnabled;
  const label = isEnabled ? "Disable interaction sounds" : "Enable interaction sounds";
  soundToggle.setAttribute("aria-label", label);
  soundToggle.setAttribute("aria-pressed", String(isEnabled));
  soundToggle.setAttribute("title", label);
  soundToggleIcons.forEach((icon) => icon.classList.toggle("hidden", icon.dataset.soundIcon !== (isEnabled ? "on" : "off")));
}
function getUiAudioContext() {
  if (uiAudioContext) return uiAudioContext;
  if (typeof window.AudioContext !== "function") {
    if (!uiAudioUnavailableWarningShown) {
      console.warn("Interaction sounds are unavailable because Web Audio is not supported.");
      uiAudioUnavailableWarningShown = true;
    }
    return null;
  }
  try {
    uiAudioContext = new window.AudioContext();
  } catch (error) {
    if (!uiAudioUnavailableWarningShown) {
      console.warn("Interaction sound audio could not be initialized.", error);
      uiAudioUnavailableWarningShown = true;
    }
    return null;
  }
  return uiAudioContext;
}
function stopUiInteractionSound() {
  if (!activeUiOscillator || !activeUiGain || !uiAudioContext) return;
  const oscillator = activeUiOscillator;
  const gain = activeUiGain;
  activeUiOscillator = null;
  activeUiGain = null;
  const now = uiAudioContext.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(0, now);
  oscillator.stop(now);
  oscillator.disconnect();
  gain.disconnect();
}
function playUiInteractionSound(cue = "ui") {
  if (!soundEnabled) return;
  const context = getUiAudioContext();
  if (!context) return;
  if (context.state !== "running") {
    context.resume().then(() => {
      if (soundEnabled && context.state === "running") playUiInteractionSound(cue);
    }).catch((error) => console.warn("Interaction sound audio could not be resumed.", error));
    return;
  }
  stopUiInteractionSound();
  try {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const cueProfile = cue === "project"
      ? { startFrequency: 520, endFrequency: 360, duration: 0.11 }
      : { startFrequency: 620, endFrequency: 420, duration: 0.085 };
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(cueProfile.startFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(cueProfile.endFrequency, now + cueProfile.duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.02, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cueProfile.duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.addEventListener("ended", () => {
      oscillator.disconnect();
      gain.disconnect();
      if (activeUiOscillator === oscillator) {
        activeUiOscillator = null;
        activeUiGain = null;
      }
    }, { once: true });
    oscillator.start(now);
    oscillator.stop(now + cueProfile.duration + 0.005);
    activeUiOscillator = oscillator;
    activeUiGain = gain;
  } catch (error) {
    console.warn("Interaction sound could not be played.", error);
  }
}
document.addEventListener("portfolio-ui-sound", (event) => {
  playUiInteractionSound(event.detail === "project" ? "project" : "ui");
});
setSoundEnabled(true);
soundToggle.addEventListener("click", () => {
  if (soundEnabled) {
    setSoundEnabled(false);
    stopUiInteractionSound();
    if (uiAudioContext?.state === "running") {
      uiAudioContext.suspend().catch((error) => console.warn("Interaction sound audio could not be suspended.", error));
    }
    return;
  }
  setSoundEnabled(true);
  const context = getUiAudioContext();
  if (context?.state === "suspended") {
    context.resume().catch((error) => console.warn("Interaction sound audio could not be resumed.", error));
  }
});

// Configure your availability in the IANA time zone you want visitors to see.
const availabilityConfig = { // Keep schedule settings together for easy editing.
  timeZone: "Asia/Manila", // Use Philippine local time as the portfolio default.
  startHour: 9, // Start showing Available at 9:00 a.m.
  endHour: 18, // Switch to Away at 6:00 p.m.
  days: [1, 2, 3, 4, 5], // Use JavaScript weekday numbers: Sunday 0 through Saturday 6.
}; // End the editable availability settings.

// Toggle the compact menu and close it after navigation or Escape.
const mobileMenuToggle = document.querySelector("#mobile-menu-toggle");
const mobileMenuLabel = document.querySelector("#menu-toggle-label");
const navMenu = document.querySelector("#nav-menu");
function setMobileMenuOpen(isOpen) {
  mobileMenuToggle.setAttribute("aria-expanded", String(isOpen));
  mobileMenuLabel.textContent = isOpen ? "Close" : "Menu";
  navMenu.classList.toggle("hidden", !isOpen);
  navMenu.classList.toggle("flex", isOpen);
}
mobileMenuToggle.addEventListener("click", () => {
  setMobileMenuOpen(mobileMenuToggle.getAttribute("aria-expanded") !== "true");
  playUiInteractionSound();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mobileMenuToggle.getAttribute("aria-expanded") === "true") {
    setMobileMenuOpen(false);
    mobileMenuToggle.focus();
    playUiInteractionSound();
  }
});

// Mark the section inside the header's reading zone as the current destination.
const navLinks = document.querySelectorAll("[data-nav-link]");
navLinks.forEach((link) => link.addEventListener("click", () => {
  const mobileMenuWasOpen = mobileMenuToggle.getAttribute("aria-expanded") === "true";
  if (mobileMenuWasOpen) setMobileMenuOpen(false);
  if (mobileMenuWasOpen || link.hash !== location.hash) playUiInteractionSound();
}));
let sectionObserver;
function setActiveNav(sectionId) {
  navLinks.forEach((link) => {
    if (link.hash === `#${sectionId}`) link.setAttribute("aria-current", link.hasAttribute("data-section-index-link") ? "true" : "location");
    else link.removeAttribute("aria-current");
  });
}
function setSectionHash(sectionId) {
  if (document.documentElement.classList.contains("intro-reload-top")) {
    if (sectionId === "home") return;
    document.documentElement.classList.remove("intro-reload-top");
  }
  const hash = `#${sectionId}`;
  if (location.hash !== hash) history.replaceState(history.state, "", hash);
}
function observeSections() {
  if (sectionObserver) sectionObserver.disconnect();
  sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      setActiveNav(target.id);
      setSectionHash(target.id);
    });
  }, { rootMargin: `${-window.innerHeight * 0.2}px 0px ${-window.innerHeight * 0.7}px 0px` });
  document.querySelectorAll("main section").forEach((section) => sectionObserver.observe(section));
}
// Pixel margins preserve the intended reading zone because IntersectionObserver percentages use width.
function syncHashNav() {
  const target = document.getElementById(location.hash.slice(1));
  if (target && target.matches("main section")) setActiveNav(target.id);
}
if (location.hash) syncHashNav();
window.addEventListener("hashchange", syncHashNav);
window.addEventListener("load", () => requestAnimationFrame(syncHashNav));
window.addEventListener("pageshow", syncHashNav);
observeSections();
window.addEventListener("resize", observeSections);

// Keep both native scroll-snap tracks moving together, pausing for keyboard focus.
const skillTracks = [...document.querySelectorAll("[data-autoplay-track]")];
const skillArea = document.querySelector("#skills-carousel-area");
let autoplayFrame;
let lastFrameTime = 0;
let focusInsideCarousel = false;
let hasInitializedSkillTracks = false;
let skillAreaIsVisible = false; // Keep autoplay off until the carousel enters the viewport.
let isDocumentVisible = !document.hidden; // Track tab visibility independently of focus.
let userPausedSkillAutoplay = false;
const skillsAutoplayToggle = document.querySelector("#skills-autoplay-toggle");
const skillMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)"); // Stop autoplay for reduced-motion users.
const trackDirections = new Map(skillTracks.map((track) => {
  const direction = track.dataset.autoplayDirection;
  if (direction !== "left" && direction !== "right") {
    throw new Error(`Invalid autoplay direction for ${track.id || "skill track"}`);
  }
  return [track, direction === "left" ? -1 : 1];
}));
const trackPositions = new Map(skillTracks.map((track) => [track, track.scrollLeft]));
function advanceSkillTracks(timestamp) {
  if (lastFrameTime) {
    const distance = Math.min(timestamp - lastFrameTime, 50) * 0.024;
    skillTracks.forEach((track) => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll <= 0) return;
      let nextScroll = trackPositions.get(track) + distance * trackDirections.get(track);
      if (nextScroll >= maxScroll) {
        nextScroll = maxScroll - (nextScroll - maxScroll);
        trackDirections.set(track, -1);
      } else if (nextScroll <= 0) {
        nextScroll = -nextScroll;
        trackDirections.set(track, 1);
      }
      trackPositions.set(track, nextScroll);
      track.scrollLeft = nextScroll;
    });
  }
  lastFrameTime = timestamp;
  autoplayFrame = requestAnimationFrame(advanceSkillTracks);
}
function updateSkillAutoplay() {
  cancelAnimationFrame(autoplayFrame);
  lastFrameTime = 0;
  const isPlaying = !focusInsideCarousel && skillAreaIsVisible && isDocumentVisible && !skillMotionPreference.matches && !userPausedSkillAutoplay; // Play only when motion is allowed and useful.
  skillTracks.forEach((track) => track.classList.toggle("is-autoplaying", isPlaying));
  if (isPlaying) {
    if (!hasInitializedSkillTracks) {
      skillTracks.forEach((track) => {
        if (trackDirections.get(track) === -1) {
          track.scrollLeft = track.scrollWidth - track.clientWidth;
        }
      });
      hasInitializedSkillTracks = true;
    }
    skillTracks.forEach((track) => {
      trackPositions.set(track, track.scrollLeft);
    });
    autoplayFrame = requestAnimationFrame(advanceSkillTracks);
  }
}
function handleSkillAreaVisibility([entry]) { // Respond only when the skills area crosses the viewport.
  skillAreaIsVisible = entry.isIntersecting; // Store whether the carousel can currently be seen.
  updateSkillAutoplay(); // Start or stop both synchronized tracks.
}
const skillAreaObserver = "IntersectionObserver" in window // Use native viewport observation rather than a polling loop.
  ? new IntersectionObserver(handleSkillAreaVisibility) // Use the named visibility handler.
  : null; // Keep the tracks static if viewport observation is unavailable.
if (skillAreaObserver) skillAreaObserver.observe(skillArea); // Observe the existing carousel region.
function handleSkillDocumentVisibility() { // Keep the autoplay loop suspended in hidden tabs.
  isDocumentVisible = !document.hidden; // Refresh the cached document visibility.
  updateSkillAutoplay(); // Apply the visibility change to the running loop.
}
document.addEventListener("visibilitychange", handleSkillDocumentVisibility); // Pause autoplay whenever the tab is hidden.
skillMotionPreference.addEventListener("change", updateSkillAutoplay); // Stop or resume when the preference changes.
skillsAutoplayToggle.addEventListener("click", () => {
  userPausedSkillAutoplay = !userPausedSkillAutoplay;
  skillsAutoplayToggle.setAttribute("aria-pressed", String(userPausedSkillAutoplay));
  skillsAutoplayToggle.textContent = userPausedSkillAutoplay ? "Resume motion" : "Pause motion";
  updateSkillAutoplay();
});
skillArea.addEventListener("focusin", (event) => {
  focusInsideCarousel = skillTracks.some((track) => track.contains(event.target));
  updateSkillAutoplay();
});
skillArea.addEventListener("focusout", (event) => { focusInsideCarousel = skillTracks.some((track) => track.contains(event.relatedTarget)); updateSkillAutoplay(); });
updateSkillAutoplay();

// Find the card's state, copy, timeline, and configured-zone clock elements.
const availabilityBadge = document.querySelector("#availability-badge"); // Select the visible state badge.
const availabilityState = document.querySelector("#availability-state"); // Select the visible Available/Away word.
const availabilityMessage = document.querySelector("#status-message"); // Select the state sentence live region.
const availabilityRelative = document.querySelector("#status-relative"); // Select the non-live relative-time detail.
const availabilityDot = document.querySelector("#availability-dot"); // Select the decorative state dot.
const availabilityTrack = document.querySelector("#availability-track"); // Select the decorative 24-hour track.
const availabilityTime = document.querySelector("#availability-time"); // Select the configured-zone clock.
const availabilityZone = document.querySelector("#availability-zone"); // Select the configured-zone label.
const availabilityNote = document.querySelector("#availability-note"); // Select the non-working-day note.
const availabilityRoot = document.documentElement; // Reuse the root to pause the pulse in hidden tabs.
// Reuse one formatter for configured-zone calendar and clock parts.
const availabilityFormatter = new Intl.DateTimeFormat("en-US", { timeZone: availabilityConfig.timeZone, weekday: "short", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short", hourCycle: "h23" }); // Avoid parsing locale-formatted strings.
// Map Intl weekday labels to the config's Sunday-zero numbering.
const weekdayNumbers = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }; // Match the editable schedule config.
// Convert a configured-zone wall-clock opening time into its matching instant.
function getZonedDate(year, month, day, hour, timeZone) { // Keep conversion independent of the visitor's locale.
  const targetTimestamp = Date.UTC(year, month - 1, day, hour); // Treat the requested local time as a UTC-shaped guess.
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }); // Read each guess back in the configured zone.
  let timestamp = targetTimestamp; // Refine the initial guess until the wall time matches.
  for (let attempt = 0; attempt < 3; attempt += 1) { // A few corrections account for the zone's UTC offset.
    const parts = formatter.formatToParts(new Date(timestamp)); // Get local date and time fields without parsing a string.
    const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])); // Store each field by its Intl part type.
    const representedTimestamp = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second)); // Convert the represented wall time to a comparable value.
    const correction = representedTimestamp - targetTimestamp; // Measure the offset from the requested local time.
    timestamp -= correction; // Apply the configured-zone offset correction.
    if (correction === 0) break; // Stop once the requested wall time matches.
  } // Finish timezone offset refinement.
  return new Date(timestamp); // Return the opening instant without mutating inputs.
} // Finish configured-zone date conversion.
// Calculate the working-hours state and next opening from an explicit date.
function getAvailability(date, config) { // Keep results deterministic for supplied test dates.
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: config.timeZone, weekday: "short", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }); // Use the supplied config's timezone.
  const parts = formatter.formatToParts(date); // Read calendar fields in the configured time zone.
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])); // Make Intl fields easy to address.
  const year = Number(values.year); // Read the configured-zone calendar year.
  const month = Number(values.month); // Read the configured-zone calendar month.
  const day = Number(values.day); // Read the configured-zone calendar day.
  const hour = Number(values.hour); // Read the configured-zone 24-hour value.
  const minute = Number(values.minute); // Read the configured-zone minute.
  const second = Number(values.second); // Read the configured-zone second for day-fraction accuracy.
  const weekday = weekdayNumbers[values.weekday]; // Convert the configured-zone weekday to the config's numbering.
  const isWorkingDay = config.days.includes(weekday); // Check the existing configured workday list.
  const minuteOfDay = hour * 60 + minute; // Compare local time with the configured boundaries.
  const online = isWorkingDay && minuteOfDay >= config.startHour * 60 && minuteOfDay < config.endHour * 60; // Use a start-inclusive and end-exclusive window.
  const dayFraction = (hour * 3600 + minute * 60 + second + date.getUTCMilliseconds() / 1000) / 86_400; // Position the marker from local midnight through the day.
  const localDate = new Date(Date.UTC(year, month - 1, day)); // Anchor the next-opening search to the configured-zone date.
  let nextOpenDate = null; // Keep empty schedules explicit instead of inventing a time.
  if (!online && config.days.length > 0) { // Search only when away and at least one day is configured.
    for (let dayOffset = 0; dayOffset <= 7; dayOffset += 1) { // Include the same weekday next week for single-day schedules.
      const candidateDate = new Date(localDate); // Keep each candidate independent of the input date.
      candidateDate.setUTCDate(localDate.getUTCDate() + dayOffset); // Advance by calendar days rather than elapsed hours.
      const candidateWeekday = candidateDate.getUTCDay(); // Read the stable Sunday-zero weekday.
      if (!config.days.includes(candidateWeekday)) continue; // Skip days outside the existing schedule.
      if (dayOffset === 0 && minuteOfDay >= config.startHour * 60) continue; // Do not choose today's opening after it has passed.
      nextOpenDate = getZonedDate(Number(candidateDate.getUTCFullYear()), candidateDate.getUTCMonth() + 1, candidateDate.getUTCDate(), config.startHour, config.timeZone); // Convert the candidate opening to its real instant.
      break; // Keep the first upcoming work opening.
    } // Finish the bounded next-opening search.
  } // Finish next-opening calculation.
  const minutesUntilOpen = nextOpenDate ? Math.ceil((nextOpenDate.getTime() - date.getTime()) / 60_000) : null; // Round up partial minutes so the countdown never ends early.
  return { online, nextOpenDate, minutesUntilOpen, isWorkingDay, dayFraction }; // Return only the requested availability facts.
} // Finish pure availability calculation.
// Update the visible state, timeline, clock, and non-live detail.
function renderStatus(now = new Date()) { // Keep rendering separate from the pure schedule calculation.
  const availability = getAvailability(now, availabilityConfig); // Calculate the state from the shared schedule config.
  const parts = Object.fromEntries(availabilityFormatter.formatToParts(now).filter((part) => part.type !== "literal").map((part) => [part.type, part.value])); // Read clock and zone-label parts once.
  const state = availability.online ? "online" : "away"; // Preserve the requested online/away data-state values.
  availabilityBadge.dataset.state = state; // Apply the badge's CSS state.
  availabilityDot.dataset.state = state; // Apply the matching decorative dot state.
  availabilityState.textContent = availability.online ? "Available" : "Away"; // Show a visible state word beside the dot.
  availabilityTrack.dataset.offToday = String(!availability.isWorkingDay); // Fade the work window on non-working days.
  availabilityTrack.style.setProperty("--now", `${availability.dayFraction * 100}%`); // Move the marker to the current configured-zone time.
  availabilityTrack.style.setProperty("--start", `${availabilityConfig.startHour / 24 * 100}%`); // Position the configured work segment.
  availabilityTrack.style.setProperty("--end", `${availabilityConfig.endHour / 24 * 100}%`); // Size the configured work segment.
  availabilityNote.textContent = availability.isWorkingDay ? "" : "Off today"; // State non-working days without relying on color.
  availabilityTime.textContent = `${parts.hour}:${parts.minute}`; // Show a 24-hour configured-zone clock.
  availabilityTime.setAttribute("datetime", now.toISOString()); // Expose the clock's actual instant semantically.
  availabilityZone.textContent = `My time (${parts.timeZoneName})`; // Derive the zone label from Intl instead of hardcoding it.
  let statusSentence = ""; // Build announcements only from state and next-open text.
  let relativeText = ""; // Keep the changing countdown outside the live region.
  if (availability.online) { // Present the truthful available-state expectation.
    statusSentence = "Available. Replying now."; // Announce the current work-hours state.
    relativeText = "Usually within a few hours."; // Show the reply expectation without a live announcement.
  } else if (availability.nextOpenDate) { // Present the next configured opening when one exists.
    const nextParts = Object.fromEntries(availabilityFormatter.formatToParts(availability.nextOpenDate).filter((part) => part.type !== "literal").map((part) => [part.type, part.value])); // Format the opening in the configured zone.
    const nextOpenText = `${nextParts.weekday} ${nextParts.hour}:${nextParts.minute}`; // Keep weekday and opening time concise.
    const hoursUntilOpen = Math.floor(availability.minutesUntilOpen / 60); // Convert full remaining hours.
    const minutesAfterHours = availability.minutesUntilOpen % 60; // Keep remaining minutes separate.
    statusSentence = `Away. Available again ${nextOpenText}.`; // Announce only state and next opening.
    relativeText = `In ${hoursUntilOpen} h ${minutesAfterHours} min.`; // Refresh the countdown outside the live region.
  } else { // Handle an intentionally empty working-days configuration.
    statusSentence = "Away. No working hours are scheduled."; // Report the configured fact without inventing a return time.
  } // Finish state-specific copy.
  if (availabilityMessage.textContent !== statusSentence) availabilityMessage.textContent = statusSentence; // Avoid repeating unchanged live announcements.
  availabilityRelative.textContent = relativeText; // Update the non-live detail and countdown.
} // Finish one card render.
// Track active timer handles so hidden tabs stop all periodic work.
let availabilityMinuteTimeout = 0; // Store the alignment timeout.
let availabilityMinuteInterval = 0; // Store the aligned minute interval.
// Clear both availability timers before pausing or restarting updates.
function clearAvailabilityTimers() { // Keep timer cleanup in one named function.
  window.clearTimeout(availabilityMinuteTimeout); // Stop the pending first minute boundary.
  window.clearInterval(availabilityMinuteInterval); // Stop subsequent minute refreshes.
  availabilityMinuteTimeout = 0; // Mark the timeout as inactive.
  availabilityMinuteInterval = 0; // Mark the interval as inactive.
} // Finish timer cleanup.
// Refresh the status once per minute without changing the live sentence unnecessarily.
function refreshAvailabilityMinute() { // Keep the repeating callback named and easy to inspect.
  renderStatus(new Date()); // Recompute the state, countdown, bar, and clock.
} // Finish one minute refresh.
// Start the regular interval after the first aligned minute boundary.
function startAvailabilityInterval() { // Keep the timeout callback named and easy to inspect.
  renderStatus(new Date()); // Refresh at the aligned boundary before recurring updates.
  availabilityMinuteInterval = window.setInterval(refreshAvailabilityMinute, 60_000); // Keep subsequent updates aligned to minutes.
} // Finish aligned interval startup.
// Render once and align subsequent refreshes to minute boundaries.
function startAvailabilityUpdates() { // Avoid accumulating timers across visibility changes.
  clearAvailabilityTimers(); // Ensure only one update schedule can be active.
  renderStatus(new Date()); // Recompute immediately after load or tab return.
  if (document.hidden) { // Avoid starting timers when the initial tab is already hidden.
    availabilityRoot.classList.add("availability-tab-hidden"); // Keep the online-dot pulse paused.
    return; // Wait for visibility before scheduling updates.
  } // Finish initial hidden-tab handling.
  availabilityRoot.classList.remove("availability-tab-hidden"); // Resume the online-dot pulse while visible.
  const delayToNextMinute = 60_000 - (Date.now() % 60_000); // Align the first timed refresh with the next minute.
  availabilityMinuteTimeout = window.setTimeout(startAvailabilityInterval, delayToNextMinute); // Start recurring updates at the minute boundary.
} // Finish visible-tab update scheduling.
// Pause timers and the pulse while hidden, then recompute when visible again.
function handleAvailabilityVisibilityChange() { // Respond to native document visibility changes.
  if (document.hidden) { // Stop periodic work when this tab is not visible.
    clearAvailabilityTimers(); // Clear the alignment timeout and minute interval.
    availabilityRoot.classList.add("availability-tab-hidden"); // Pause the only looping status animation.
    return; // Wait for the next visibility event before restarting.
  } // Finish hidden-tab handling.
  startAvailabilityUpdates(); // Recompute immediately and schedule the next minute.
} // Finish visibility handling.
// Leave the template status card unconfigured until an approved schedule exists.
if (availabilityState?.textContent !== "Unconfigured") {
  startAvailabilityUpdates();
  document.addEventListener("visibilitychange", handleAvailabilityVisibilityChange);
}

function splitHeroHeadline(heading) {
  const fullText = heading.textContent.replace(/\s+/g, " ").trim();
  const words = fullText.split(" ");
  const fragment = document.createDocumentFragment();
  const wordElements = words.map((word, index) => {
    if (index > 0) fragment.append(document.createTextNode(" "));
    const wordElement = document.createElement("span");
    wordElement.classList.add("hero-title-word");
    wordElement.setAttribute("aria-hidden", "true");
    wordElement.style.setProperty("--word-index", String(index));
    if (index === words.length - 1) {
      wordElement.classList.add("text-accent");
      // Expose the final visual word to its one-time CSS shimmer.
      wordElement.dataset.shimmerText = word;
    }
    wordElement.textContent = word;
    fragment.append(wordElement);
    return wordElement;
  });

  heading.setAttribute("aria-label", fullText);
  heading.replaceChildren(fragment);
  return wordElements;
}

function prepareRoleLine(roleLine) {
  const fullText = roleLine.textContent.replace(/\s+/g, " ").trim();
  const accessibleText = document.createElement("span");
  const reservedLine = document.createElement("span");
  const visualLine = document.createElement("span");
  const visualRole = document.createElement("span");
  const caret = document.createElement("span");

  accessibleText.classList.add("sr-only");
  accessibleText.textContent = fullText;
  reservedLine.classList.add("hero-role-reserve");
  reservedLine.setAttribute("aria-hidden", "true");
  reservedLine.textContent = fullText;
  visualLine.classList.add("hero-role-visual");
  visualLine.setAttribute("aria-hidden", "true");
  visualRole.setAttribute("aria-hidden", "true");
  caret.classList.add("hero-role-caret");
  caret.setAttribute("aria-hidden", "true");
  visualRole.textContent = fullText;
  visualLine.append(visualRole, caret);
  roleLine.replaceChildren(accessibleText, reservedLine, visualLine);

  return { visualRole, caret };
}

function startRoleTyping(visualRole, caret, roles, motionPreference) {
  let roleIndex = 0;
  let characterIndex = 0;
  let isDeleting = false;
  let timerId;
  let isOnScreen = false; // Start paused until the existing viewport observer confirms the line is visible.
  let isPaused = document.hidden || !isOnScreen; // Keep the text cycle idle while hidden or off-screen.
  const roleLine = visualRole.closest("#hero-tagline"); // Observe the same element whose text is being cycled.
  function handleRoleVisibility([entry]) { // Pause the existing text cycle outside the viewport.
    isOnScreen = entry.isIntersecting; // Track whether the animated line is in the viewport.
    isPaused = document.hidden || !isOnScreen; // Pause when the tab or line is not visible.
    if (isPaused) window.clearTimeout(timerId); // Cancel the pending character update while paused.
    else schedule(80); // Resume from the current phrase without restarting it.
  }
  const roleObserver = "IntersectionObserver" in window // Prefer native observation over polling.
    ? new IntersectionObserver(handleRoleVisibility) // Reuse native visibility signaling for this existing loop.
    : null; // Leave the existing typing behavior intact if IntersectionObserver is unavailable.
  let hasFinished = false;

  function handleMotionPreferenceChange(event) {
    if (event.matches) finish();
  }

  function schedule(delay) {
    if (!isPaused && !hasFinished) timerId = window.setTimeout(tick, delay);
  }

  function finish() {
    if (hasFinished) return;
    hasFinished = true;
    window.clearTimeout(timerId);
    visualRole.textContent = roles[0];
    caret.classList.remove("is-active");
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    motionPreference.removeEventListener("change", handleMotionPreferenceChange);
    roleObserver?.disconnect(); // Release the visibility observer when reduced motion ends the cycle.
  }

  function tick() {
    const currentRole = roles[roleIndex];
    characterIndex += isDeleting ? -1 : 1;
    visualRole.textContent = currentRole.slice(0, characterIndex);

    if (!isDeleting && characterIndex === currentRole.length) {
      isDeleting = true;
      schedule(1200);
      return;
    }

    if (isDeleting && characterIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
    }
    schedule(isDeleting ? 25 : 40);
  }

  function handleVisibilityChange() {
    isPaused = document.hidden || !isOnScreen; // Keep tab visibility and viewport visibility in sync.
    if (isPaused) window.clearTimeout(timerId);
    else schedule(80);
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);
  motionPreference.addEventListener("change", handleMotionPreferenceChange);
  if (roleObserver) roleObserver.observe(roleLine); // Pause this loop when its own line leaves the viewport.
  else { isOnScreen = true; isPaused = document.hidden; } // Preserve typing on browsers without IntersectionObserver.
  visualRole.textContent = "";
  caret.classList.add("is-active");
  schedule(40);
}

function createHeadingDecryptLayer(text) { // Build one accessible-hidden layer for the visual decode.
  const layer = document.createElement("span"); // Create the visual layer without parsing markup.
  const characters = []; // Keep only letters and digits available for scrambling.
  const fragment = document.createDocumentFragment(); // Batch the character nodes before attaching them.
  layer.classList.add("section-heading-visual"); // Apply the decorative overlay styling.
  layer.setAttribute("aria-hidden", "true"); // Keep changing glyphs out of the accessible name.
  for (const character of Array.from(text)) { // Iterate code points so punctuation and spaces remain intact.
    if (!/[\p{L}\p{N}]/u.test(character)) { // Preserve whitespace and punctuation exactly.
      fragment.append(document.createTextNode(character)); // Add unchanged separators as text nodes.
      continue; // Do not add punctuation to the scramble set.
    }
    const glyph = document.createElement("span"); // Wrap each eligible character for its stagger.
    glyph.textContent = character; // Start from the real character before the first frame.
    fragment.append(glyph); // Keep the words readable in the DOM until scrambling begins.
    characters.push({ element: glyph, index: characters.length }); // Store its left-to-right stagger position.
  }
  layer.append(fragment); // Attach the prepared glyphs in one DOM update.
  return { layer, characters }; // Return the layer and the minimal set of animated glyphs.
}

function initHeadingDecrypt() { // Serialize decode runs and expose a stable accessible heading name.
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)"); // Respect the current motion preference.
  const states = new WeakMap(); // Keep heading state private without retaining removed nodes.
  const pending = []; // Serialize headings so no two decrypt runs overlap.
  const characterSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; // Use a fixed, restrained decoding alphabet.
  const duration = 700; // Keep each heading run within the requested 600–800ms range.
  const stagger = 8; // Delay each successive glyph by a small left-to-right interval.
  const cooldown = 5000; // Prevent replaying a heading within five seconds.
  let activeRun = null; // Allow at most one heading to scramble at a time.

  function getState(heading) { // Lazily capture each eligible section heading once.
    let state = states.get(heading); // Reuse state after a reveal replay.
    if (!state) { // Initialize only section headings that the existing reveal targets contain.
      const section = heading.closest("main > section[id]:not(#home)"); // Exclude the hero and modal headings.
      if (!section || section.getAttribute("aria-labelledby") !== heading.id) return null; // Require the section's own accessible heading.
      state = { // Store the exact visible text and replay bookkeeping.
        heading, // Keep the source heading for the accessible name and layer insertion.
        text: heading.textContent.replace(/\s+/g, " ").trim(), // Match the browser-rendered text spacing.
        reserve: null, // Create the invisible sizing layer only when the first run begins.
        visual: null, // Replace the visual layer on each permitted replay.
        characters: [], // Store only letters and digits for the active run.
        lastRunAt: 0, // Allow the first reveal immediately.
        isVisible: false, // Wait for the existing observer to confirm visibility.
      };
      states.set(heading, state); // Retain this state for the current heading node.
    }
    return state; // Return the reusable heading state.
  }

  function finishRun(run) { // Settle the active heading and advance the visible queue.
    if (activeRun !== run) return; // Ignore stale timer callbacks after a preference change.
    window.clearInterval(run.intervalId); // Stop the recurring glyph updates.
    window.clearTimeout(run.timeoutId); // Cancel the scheduled completion if it already fired.
    run.state.visual.textContent = run.state.text; // Always finish with the exact original text.
    activeRun = null; // Release the single active-run slot.
    startNext(); // Continue only after the previous heading is fully settled.
  }

  function updateGlyphs(run) { // Scramble eligible characters without measuring or shifting layout.
    if (reducedMotion.matches) { finishRun(run); return; } // Settle immediately if the preference changes mid-run.
    const elapsed = performance.now() - run.startedAt; // Measure animation progress without reading layout.
    for (const { element, index } of run.state.characters) { // Update each letter after its stagger begins.
      if (elapsed >= index * stagger) element.textContent = characterSet[Math.floor(Math.random() * characterSet.length)]; // Scramble with the fixed character set.
    }
  }

  function startNext() { // Start at most one currently visible heading.
    if (activeRun || reducedMotion.matches) return; // Never overlap runs or animate under reduced motion.
    while (pending.length) { // Skip queued headings that are no longer eligible.
      const state = pending.shift(); // Consider headings in the order they were revealed.
      if (!state.isVisible || Date.now() - state.lastRunAt < cooldown) continue; // Enforce visibility and cooldown.
      if (!state.reserve) { // Build the fixed-size reserve layer on the first run.
        state.reserve = document.createElement("span"); // Use DOM APIs only.
        state.reserve.classList.add("section-heading-reserve"); // Let this layer determine the heading dimensions.
        state.reserve.setAttribute("aria-hidden", "true"); // The heading's aria-label is the accessible name.
        state.reserve.textContent = state.text; // Preserve the exact final text invisibly behind the animation.
        state.heading.setAttribute("aria-label", state.text); // Expose stable, unchanging text to screen readers.
        state.heading.classList.add("section-heading-decrypt"); // Enable the overlapping grid only for animated headings.
      }
      const visual = createHeadingDecryptLayer(state.text); // Recreate original glyphs for a possible cooldown replay.
      state.visual = visual.layer; // Keep the visible layer for exact finalization.
      state.characters = visual.characters; // Keep the new glyph elements for this run only.
      state.heading.replaceChildren(state.reserve, state.visual); // Overlay animation on the invisible size reserve.
      state.lastRunAt = Date.now(); // Start the cooldown when the heading actually begins.
      const run = { state, startedAt: performance.now(), intervalId: 0, timeoutId: 0 }; // Capture this run's timers and clock.
      activeRun = run; // Claim the single active-run slot before scheduling callbacks.
      run.intervalId = window.setInterval(updateGlyphs, 40, run); // Update the glyphs at a modest fixed cadence.
      run.timeoutId = window.setTimeout(finishRun, duration, run); // Settle at the exact 700ms endpoint.
      return; // Leave the next heading queued until this run finishes.
    }
  }

  function updateHeadings(target, isVisible) { // Receive visibility from the existing reveal observer.
    if (!target.matches("main > section[id]:not(#home) > div:first-child")) return; // Restrict work to section heading groups.
    for (const heading of target.querySelectorAll("h2")) { // Find only headings inside that section group.
      const state = getState(heading); // Reject nested status, modal, or non-section headings.
      if (!state) continue; // Ignore anything that is not the section's labelled heading.
      state.isVisible = isVisible; // Keep queued work aligned with the existing reveal observer.
      if (isVisible) { // Queue only headings whose reveal has reached its visible threshold.
        if (state.lastRunAt && Date.now() - state.lastRunAt < cooldown) continue; // Honor the five-second replay cooldown.
        if (state !== activeRun?.state && !pending.includes(state)) pending.push(state); // Avoid duplicate queued runs.
        startNext(); // Start immediately when no other heading is active.
      } else { // Remove off-screen headings that have not started yet.
        const queuedIndex = pending.indexOf(state); // Find this heading in the serialized queue.
        if (queuedIndex !== -1) pending.splice(queuedIndex, 1); // Do not start a stale run after scrolling away.
      }
    }
  }

  function handleMotionPreferenceChange({ matches }) { // Finish immediately if reduced motion becomes active.
    if (!matches) return; // Turning motion back on does not replay a heading by itself.
    pending.length = 0; // Discard queued visual effects under reduced motion.
    if (activeRun) finishRun(activeRun); // Settle the active heading immediately.
  }

  reducedMotion.addEventListener("change", handleMotionPreferenceChange); // Respond if the preference changes during a run.
  return updateHeadings; // Let the existing reveal observer drive all heading visibility.
}

function initScrollReveal() {
  // Keep existing reveals; reduced-motion users see them immediately without observation.
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const revealTargets = document.querySelectorAll("main > section[id]:not(#home) > div:first-child, main > section#about > article, main > section#projects #project-grid > .project-card, main > section#experience > ol > li, main > section#contact > .grid > div");
  const updateHeadingVisibility = initHeadingDecrypt(); // Reuse the reveal observer instead of adding another one.
  if (motionPreference.matches || !("IntersectionObserver" in window)) return;
  const root = document.documentElement; let previousY = window.scrollY; let scrollFrame = 0;
  // Track direction at most once per animation frame.
  window.addEventListener("scroll", () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => { const currentY = window.scrollY; root.dataset.scrollDirection = currentY < previousY ? "up" : "down"; previousY = currentY; scrollFrame = 0; });
  }, { passive: true });
  // Keep each group's stagger for every replay.
  revealTargets.forEach((target) => {
    target.classList.add("motion-reveal");
    if (target.matches("#project-grid > .project-card, #experience > ol > li, #contact > .grid > div")) target.style.setProperty("--reveal-delay", `${[...target.parentElement.children].indexOf(target) * 60}ms`);
  });
  const pendingReset = new Set();
  const isInteracting = (target) => target.matches(":hover") || target.contains(document.activeElement);
  // Reset instantly, then restore transitions before a possible re-entry.
  const reset = (target) => {
    if (motionPreference.matches || !target.classList.contains("is-visible")) return;
    target.classList.add("is-resetting"); target.classList.remove("is-visible"); requestAnimationFrame(() => target.classList.remove("is-resetting"));
  };
  // Finish deferred resets after focus or hover ends.
  const flushPending = () => pendingReset.forEach((target) => { if (!isInteracting(target)) { pendingReset.delete(target); reset(target); } });
  document.addEventListener("focusout", flushPending);
  document.addEventListener("pointerout", flushPending);
  // Use both thresholds; the expanded root resets only beyond the viewport edge.
  const observer = new IntersectionObserver((entries) => {
    if (motionPreference.matches) return;
    entries.forEach(({ target, isIntersecting, intersectionRatio }) => {
      if (isIntersecting) {
        pendingReset.delete(target);
        if (intersectionRatio < 0.15) { updateHeadingVisibility(target, false); return; } // Do not queue a barely visible heading.
        updateHeadingVisibility(target, true); // Trigger decoding from the existing reveal observer.
        target.classList.remove("is-resetting"); target.classList.add("is-visible");
      } else {
        updateHeadingVisibility(target, false); // Drop queued heading work when its reveal target leaves view.
        if (target.classList.contains("is-visible")) { if (isInteracting(target)) pendingReset.add(target); else reset(target); }
      }
    });
  }, { threshold: [0, 0.15], rootMargin: "24px 0px" });
  revealTargets.forEach((target) => observer.observe(target));
  // Disconnect during a live reduced-motion change and resume only when motion is allowed.
  motionPreference.addEventListener("change", ({ matches }) => matches ? observer.disconnect() : revealTargets.forEach((target) => observer.observe(target)));
}

function initPortfolioIntro() { // Run the optional first-visit intro without making it a page-loading dependency.
  const lines = ["Booting portfolio…", "Loading projects…", "Ready."]; // Keep the short, honest boot copy editable in one place.
  const root = document.documentElement; // Use the document root to coordinate CSS-only motion states.
  const overlay = document.querySelector(".intro-overlay"); // Reuse the decorative overlay already present in the HTML.
  const lineContainer = document.querySelector("#intro-lines"); // Keep the three decorative lines in their existing container.
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)"); // Respond if the visitor changes motion settings mid-intro.
  const lineTimers = []; // Retain the brief reveal timers so a skip can cancel them.
  let exitTimer; // Track the scheduled normal exit.
  let removalTimer; // Track the exit transition cleanup.
  let isComplete = false; // Make every skip, preference change, and history restore idempotent.

  function revealLine(line) { // Reveal one decorative line without changing document content.
    if (isComplete) return; // Ignore a queued reveal after the intro has been skipped.
    line.classList.add("is-visible"); // Start the CSS opacity and transform transition.
  } // Finish one line reveal.

  function removeIntroListeners() { // Release every temporary listener when the overlay exits.
    document.removeEventListener("keydown", skipIntro); // Keep keyboard input from retaining the completed intro.
    document.removeEventListener("pointerdown", skipIntro, true); // Keep pointer input from retaining the completed intro.
    document.removeEventListener("click", skipIntro, true); // Keep assistive and synthetic clicks from retaining the completed intro.
    window.removeEventListener("pageshow", handlePageShow); // Stop observing history restores after completion.
    motionPreference.removeEventListener("change", handleMotionPreferenceChange); // Stop observing preference changes after completion.
  } // Finish listener cleanup.

  function completeIntro(isFailsafeRecovery = false) { // Remove the overlay and release the hero choreography exactly once.
    if (isComplete) return; // Ignore duplicate click, key, timeout, and media-query events.
    isComplete = true; // Mark completion before invoking any cleanup that can re-enter.
    window.clearTimeout(exitTimer); // Cancel the normal exit if the visitor skipped.
    window.clearTimeout(removalTimer); // Cancel any pending transition cleanup.
    for (const timerId of lineTimers) window.clearTimeout(timerId); // Stop line reveals that no longer have a visible target.
    removeIntroListeners(); // Release temporary input and lifecycle listeners.
    overlay?.remove(); // Remove the decorative layer instead of leaving an invisible element behind.
    if (isFailsafeRecovery) root.classList.add("intro-settled"); // Keep late JavaScript from replaying an entrance already shown by CSS.
    root.classList.remove("intro-pending"); // Restore the page's normal interactive state.
    root.classList.add("intro-done"); // Start the CSS-staggered hero entrance.
    root.dispatchEvent(new Event("portfolio-intro-done")); // Let the existing text motion wait for its new start point.
  } // Finish the normal and skipped exit.

  function skipIntro() { // Allow any pointer or keyboard input to dismiss the overlay immediately.
    completeIntro(); // Do not prevent the visitor's keyboard or pointer event from continuing.
  } // Finish the input skip.

  function handlePageShow(event) { // Do not resume an unfinished intro after a back-forward cache restore.
    if (event.persisted) completeIntro(); // Restore the usable portfolio rather than replaying the overlay.
  } // Finish history-restore handling.

  function handleMotionPreferenceChange(event) { // Keep the visible page static if reduced motion is enabled mid-intro.
    if (event.matches) completeIntro(); // End immediately; the reduced-motion CSS exposes final states.
  } // Finish preference-change handling.

  function startOutro() { // Begin the short normal exit after all three lines have appeared.
    if (isComplete) return; // Do not restart an intro already dismissed by the visitor.
    overlay.classList.add("is-exiting"); // Slide and fade the overlay along its entrance axis.
    removalTimer = window.setTimeout(completeIntro, 350); // Remove it when the requested exit transition finishes.
  } // Finish the normal outro start.

  if (!root.classList.contains("intro-pending")) return; // Hash, history, repeat, storage, and motion skips render directly.
  if (!overlay || !lineContainer) { // Fail open if the expected decorative markup is missing.
    completeIntro(); // Restore the hero rather than leaving it in its pending state.
    return; // Do not continue with incomplete overlay markup.
  } // Finish the defensive markup check.
  if (motionPreference.matches) { // Recheck the preference in case it changed after the head script ran.
    completeIntro(); // Do not animate for a reduced-motion visitor.
    return; // Keep the page in its final state.
  } // Finish the late preference check.
  if (getComputedStyle(overlay).opacity === "0") { // Detect a boot overlay already faded by its CSS failsafe.
    completeIntro(true); // Skip a stale boot without replaying an entrance already shown by CSS.
    return; // Do not replay an intro whose safety timeout already elapsed.
  } // Finish the expired-overlay check.
  for (let index = 0; index < lines.length; index += 1) { // Build the accessible-hidden lines as plain text nodes.
    const line = document.createElement("p"); // Use a native text block for each short status line.
    line.classList.add("intro-line"); // Apply the one-shot opacity and transform reveal.
    line.textContent = lines[index]; // Keep the decorative copy out of HTML parsing.
    lineContainer.append(line); // Attach each line without innerHTML.
    lineTimers.push(window.setTimeout(revealLine, 100 + index * 180, line)); // Give each short boot line a little more time to read.
  } // Finish building and scheduling the three lines.
  document.addEventListener("keydown", skipIntro); // Any key dismisses the decorative intro without trapping focus.
  document.addEventListener("pointerdown", skipIntro, true); // Dismiss the visual overlay without intercepting the target's pointer input.
  document.addEventListener("click", skipIntro, true); // Dismiss on click-only activation paths as a fallback.
  window.addEventListener("pageshow", handlePageShow); // Handle a page restored from the browser's back-forward cache.
  motionPreference.addEventListener("change", handleMotionPreferenceChange); // End the intro if reduced motion becomes active.
  exitTimer = window.setTimeout(startOutro, 660); // Let the last line finish its reveal before the overlay exits.
} // Finish the intro controller.

function initTextAnimations() {
  const heading = document.querySelector("#hero-title");
  const roleLine = document.querySelector("#hero-tagline");
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  // Use exact fragments from the approved content draft; the complete tagline stays screen-reader-only.
  const roles = [
    "I build useful digital experiences.",
    "I’m ready to share my work.",
    "I solve problems.",
    "I build secure systems.",
    "I troubleshoot technical issues.",
    "I build web and mobile apps.",
    "I help people use technology.",
  ];
  const headlineWords = heading ? splitHeroHeadline(heading) : [];
  const roleParts = roleLine ? prepareRoleLine(roleLine) : null;
  document.documentElement.classList.add("js");

  if (motionPreference.matches) {
    initScrollReveal();
    if (roleParts) roleParts.visualRole.textContent = roles[0];
    return;
  }

  function startHeroMotion() { // Start the existing text effects from their new points in the hero sequence.
    window.requestAnimationFrame(revealHeadlineWords); // Keep the existing word-by-word reveal logic.
    if (roleParts) window.setTimeout(startRoleTyping, 560, roleParts.visualRole, roleParts.caret, roles, motionPreference); // Begin typing after the role line has entered.
    window.setTimeout(initScrollReveal, 1200); // Keep section reveals out of the hero's short entrance window.
  } // Finish the coordinated text-motion handoff.

  function revealHeadlineWords() { // Preserve the existing headline reveal state change.
    headlineWords.forEach((word) => word.classList.add("is-visible")); // Let the CSS keep its original per-word stagger.
  } // Finish the headline reveal callback.

  if (document.documentElement.classList.contains("intro-done")) { // Handle a visit that skipped the overlay before main.js ran.
    startHeroMotion(); // Start the entrance immediately on an eligible motion visit.
    return; // Avoid registering an event that has already occurred.
  } // Finish the precompleted-intro path.
  document.documentElement.addEventListener("portfolio-intro-done", startHeroMotion, { once: true }); // Start the existing text effects as soon as the intro exits.
}

function initProfileRingVisibility(frame) { // Pause the existing ring when its frame or tab is hidden.
  const root = document.documentElement; // Reuse the root that signals the intro handoff.
  const photo = frame.querySelector(".profile-photo-image"); // Track the existing photo's transform transition.
  const introIsPending = root.classList.contains("intro-pending"); // Preserve the existing immediate path for skipped visits.
  let isOnScreen = false; // Start paused until the photo enters the viewport.
  let entranceFallbackTimer; // Recover if a transition event is lost under slow or failing CSS initialization.
  function markPhotoEntered() { // Release the existing photo effects exactly once when its entrance settles.
    if (frame.classList.contains("is-intro-photo-entered")) return; // Ignore duplicate transition and timeout handoffs.
    frame.classList.add("is-intro-photo-entered"); // Mark the photo ready for its existing ring and tilt effects.
    window.clearTimeout(entranceFallbackTimer); // Cancel the safety timer when the transition event arrives first.
    updatePlayback(); // Start the ring only if the photo and tab are both visible.
  } // Finish the photo-ready handoff.
  function updatePlayback() { // Apply the combined page and viewport visibility state.
    const photoIsReady = frame.classList.contains("is-intro-photo-entered"); // Keep the ring still until its photo has finished entering.
    frame.classList.toggle("is-ring-paused", document.hidden || !isOnScreen || !photoIsReady); // Pause outside the tab, viewport, or photo entrance.
  } // Finish the combined playback state.
  function handlePhotoEntrance(event) { // Release the ring only after the existing photo has reached its settled state.
    if (event.propertyName !== "transform") return; // Ignore the photo's concurrent opacity transition.
    markPhotoEntered(); // Hand off after the photo transform settles.
  } // Finish the photo entrance handoff.
  function handleIntroComplete() { // Preserve the transition handoff with a short safety timeout.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { // Respect a reduced-motion change during the intro.
      markPhotoEntered(); // The reduced-motion CSS already exposes the final photo state.
      return; // Do not wait for a transition that will not run.
    } // Finish the reduced-motion handoff.
    entranceFallbackTimer = window.setTimeout(markPhotoEntered, 850); // Cover the 420ms delay, 220ms transition, and a small frame buffer.
  } // Finish the photo entrance handoff.
  function handlePhotoVisibility([entry]) { // Update ring playback only on intersection changes.
    isOnScreen = entry.isIntersecting; // Store whether the photo frame is visible.
    updatePlayback(); // Apply the current tab and viewport state.
  } // Finish photo visibility updates.
  const observer = "IntersectionObserver" in window // Use the browser's visibility signal without polling.
    ? new IntersectionObserver(handlePhotoVisibility) // Update the ring only when its visibility changes.
    : null; // Leave the ring static when visibility cannot be measured.
  if (observer) observer.observe(frame); // Observe the existing portrait frame.
  if (introIsPending) root.addEventListener("portfolio-intro-done", handleIntroComplete, { once: true }); // Wait for the intro before scheduling the safety handoff.
  else markPhotoEntered(); // Start existing photo effects immediately on skipped visits.
  photo?.addEventListener("transitionend", handlePhotoEntrance); // Hand off when the photo transform settles normally.
  document.addEventListener("visibilitychange", updatePlayback); // Pause the ring while another tab is active.
  updatePlayback(); // Apply the initial hidden-tab state before the observer responds.
}

function initPhotoEffects() {
  const frame = document.querySelector(".profile-photo-frame");
  if (!frame) return;

  initProfileRingVisibility(frame); // Keep the existing ring paused off-screen and in hidden tabs.
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let isEnabled = false;
  let animationFrame = 0;
  let pointerX = 0;
  let pointerY = 0;

  function resetTilt() {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    frame.classList.remove("is-pointer-tracking");
    frame.style.transform = "";
  }

  function applyTilt() {
    animationFrame = 0;
    const bounds = frame.getBoundingClientRect();
    const horizontal = Math.max(-1, Math.min(1, ((pointerX - bounds.left) / bounds.width) * 2 - 1));
    const vertical = Math.max(-1, Math.min(1, ((pointerY - bounds.top) / bounds.height) * 2 - 1));
    frame.style.transform = `perspective(900px) rotateX(${-vertical * 6}deg) rotateY(${horizontal * 6}deg)`;
  }

  function handlePointerMove(event) {
    if (!frame.classList.contains("is-intro-photo-entered")) return; // Keep tilt dormant until the photo entrance has settled.
    if (event.pointerType !== "mouse") {
      resetTilt();
      return;
    }
    pointerX = event.clientX;
    pointerY = event.clientY;
    frame.classList.add("is-pointer-tracking");
    if (!animationFrame) animationFrame = window.requestAnimationFrame(applyTilt);
  }

  function syncTiltAvailability() {
    const shouldEnable = finePointer.matches && !reducedMotion.matches;
    if (shouldEnable === isEnabled) return;
    isEnabled = shouldEnable;
    if (isEnabled) {
      frame.addEventListener("pointermove", handlePointerMove, { passive: true });
      frame.addEventListener("pointerleave", resetTilt);
      frame.addEventListener("pointercancel", resetTilt);
      return;
    }
    frame.removeEventListener("pointermove", handlePointerMove);
    frame.removeEventListener("pointerleave", resetTilt);
    frame.removeEventListener("pointercancel", resetTilt);
    resetTilt();
  }

  finePointer.addEventListener("change", syncTiltAvailability);
  reducedMotion.addEventListener("change", syncTiltAvailability);
  syncTiltAvailability();
}

initTextAnimations();
initPhotoEffects();

function initCursor() {
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const dot = document.createElement("span");
  const ring = document.createElement("span");
  dot.classList.add("custom-cursor-dot");
  ring.classList.add("custom-cursor-ring");
  dot.setAttribute("aria-hidden", "true");
  ring.setAttribute("aria-hidden", "true");
  document.body.append(dot, ring);

  let enabled = false;
  let hasPointerPosition = false;
  let isWindowVisible = !document.hidden;
  let animationFrame = 0;
  let pointerX = 0;
  let pointerY = 0;
  let ringX = 0;
  let ringY = 0;
  let ringScale = 1;
  let targetScale = 1;

  function setCursorVisible(isVisible) {
    document.body.classList.toggle("custom-cursor-active", isVisible);
    dot.classList.toggle("is-visible", isVisible); // Keep the cursor visible when it is moved into a top-layer dialog.
    ring.classList.toggle("is-visible", isVisible); // Keep the cursor visible when it is moved into a top-layer dialog.
  }

  function getCursorPosition(x, y) { // Convert viewport coordinates for the fixed elements inside the filtered project dialog.
    const projectDialog = dot.parentElement.closest("#project-modal"); // Its backdrop filter establishes a local fixed-position containing block.
    if (!projectDialog) return { x, y }; // The page and screenshot viewer use viewport coordinates directly.
    const bounds = projectDialog.getBoundingClientRect(); // Measure the containing block's viewport origin.
    return { x: x - bounds.left, y: y - bounds.top }; // Keep the rendered cursor aligned with the physical pointer.
  } // The cursor's animation state remains in viewport coordinates.

  function animateRing() {
    if (!enabled || !isWindowVisible || !hasPointerPosition) {
      animationFrame = 0;
      return;
    }

    ringX += (pointerX - ringX) * 0.22;
    ringY += (pointerY - ringY) * 0.22;
    ringScale += (targetScale - ringScale) * 0.22;
    const ringPosition = getCursorPosition(ringX, ringY); // Convert the eased position into the cursor's current containing block.
    ring.style.transform = `translate3d(${ringPosition.x}px, ${ringPosition.y}px, 0) translate3d(-50%, -50%, 0) scale(${ringScale})`;
    if (
      Math.abs(pointerX - ringX) > 0.1
      || Math.abs(pointerY - ringY) > 0.1
      || Math.abs(targetScale - ringScale) > 0.01
    ) {
      animationFrame = window.requestAnimationFrame(animateRing);
    } else {
      animationFrame = 0;
    }
  }

  function updateRingPosition() {
    if (animationFrame || !enabled || !isWindowVisible) return;
    animationFrame = window.requestAnimationFrame(animateRing);
  }

  function handlePointerMove(event) {
    if (!enabled || event.pointerType !== "mouse") return;
    const isTextControl = event.target instanceof Element
      && event.target.closest('input, textarea, select, [contenteditable="true"]');
    if (isTextControl) {
      hasPointerPosition = false;
      setCursorVisible(false);
      return;
    }

    pointerX = event.clientX;
    pointerY = event.clientY;
    const dotPosition = getCursorPosition(pointerX, pointerY); // Keep the dot under the pointer inside filtered dialogs.
    dot.style.transform = `translate3d(${dotPosition.x}px, ${dotPosition.y}px, 0) translate3d(-50%, -50%, 0)`;
    if (!hasPointerPosition) {
      ringX = pointerX;
      ringY = pointerY;
      ringScale = targetScale;
      const ringPosition = getCursorPosition(ringX, ringY); // Initialize the ring in the same coordinate space as the dot.
      ring.style.transform = `translate3d(${ringPosition.x}px, ${ringPosition.y}px, 0) translate3d(-50%, -50%, 0) scale(${ringScale})`;
    }
    hasPointerPosition = true;
    setCursorVisible(true);
    updateRingPosition();
  }

  function updateInteractiveTarget(event) {
    if (!enabled || !(event.target instanceof Element)) return;
    const interactive = event.target.closest("a, button, [role='button']");
    ring.classList.toggle("is-interactive", Boolean(interactive));
    targetScale = interactive ? 1.5 : 1;
    updateRingPosition();
  }

  function handlePointerDown(event) {
    if (!enabled || event.pointerType !== "mouse") return;
    targetScale = 0.8;
    updateRingPosition();
  }

  function handlePointerUp() {
    if (!enabled) return;
    targetScale = ring.classList.contains("is-interactive") ? 1.5 : 1;
    updateRingPosition();
  }

  function handlePointerCancel() {
    targetScale = ring.classList.contains("is-interactive") ? 1.5 : 1;
    updateRingPosition();
  }

  function handleWindowPointerOut(event) {
    if (event.relatedTarget !== null) return;
    hasPointerPosition = false;
    setCursorVisible(false);
  }

  function handleVisibilityChange() {
    isWindowVisible = !document.hidden;
    if (!isWindowVisible) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      hasPointerPosition = false;
      setCursorVisible(false);
    } else {
      updateRingPosition();
    }
  }

  function suspendCursor() {
    hasPointerPosition = false;
    ring.classList.remove("is-interactive");
    targetScale = 1;
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    setCursorVisible(false);
  }

  function disableCursor() {
    enabled = false;
    hasPointerPosition = false;
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    setCursorVisible(false);
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerover", updateInteractiveTarget);
    document.removeEventListener("pointerout", updateInteractiveTarget);
    document.removeEventListener("pointerdown", handlePointerDown);
    document.removeEventListener("pointerup", handlePointerUp);
    document.removeEventListener("pointercancel", handlePointerCancel);
    window.removeEventListener("pointerout", handleWindowPointerOut);
    document.removeEventListener("keydown", suspendCursor);
  }

  function enableCursor() {
    if (enabled || !finePointer.matches || reducedMotion.matches) return;
    enabled = true;
    document.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerover", updateInteractiveTarget, { passive: true });
    document.addEventListener("pointerout", updateInteractiveTarget, { passive: true });
    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("pointercancel", handlePointerCancel, { passive: true });
    window.addEventListener("pointerout", handleWindowPointerOut, { passive: true });
    document.addEventListener("keydown", suspendCursor);
  }

  function syncCursorAvailability() {
    if (finePointer.matches && !reducedMotion.matches) enableCursor();
    else disableCursor();
  }

  finePointer.addEventListener("change", syncCursorAvailability);
  reducedMotion.addEventListener("change", syncCursorAvailability);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  syncCursorAvailability();
}

initCursor();
