// Validate required fields and keep errors beside the fields that need attention.
const contactForm = document.querySelector("#contact-form"); // Locate the existing contact form.
const formSuccess = document.querySelector("#form-success"); // Locate the accessible success announcement.
const contactPriority = document.querySelector("#contact-priority"); // Locate the visitor's selected priority.
const formFields = [ // Keep the existing required inputs and validation messages together.
  [document.querySelector("#contact-name"), document.querySelector("#name-error"), "Enter your name."], // Validate the visitor name.
  [document.querySelector("#contact-email"), document.querySelector("#email-error"), "Enter your email address."], // Validate the reply address.
  [document.querySelector("#contact-message"), document.querySelector("#message-error"), "Write a message."],
]; // Finish the existing required-field list.
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Keep the existing basic email format check.

// Keep the existing validation, then open a prepared email in the visitor's mail client.
contactForm.addEventListener("submit", (event) => { // Handle the form without navigating away.
  event.preventDefault();
  formSuccess.textContent = ""; // Clear any previous success announcement.
  let firstInvalidField = null; // Remember the first field that needs attention.

  formFields.forEach(([input, error, emptyMessage]) => { // Validate every existing required field.
    const value = input.value.trim(); // Ignore whitespace-only values.
    const errorMessage = !value // Check for an empty required value first.
      ? emptyMessage // Keep the existing field-specific empty message.
      : input.type === "email" && !emailPattern.test(value) // Apply the existing email format check.
        ? "Enter a valid email address." // Keep the existing invalid-email message.
        : ""; // Mark a valid field with no error text.
    error.textContent = errorMessage; // Set validation text without parsing markup.
    if (errorMessage) { // Track invalid fields and their accessible state.
      input.setAttribute("aria-invalid", "true"); // Expose the invalid state to assistive technology.
      firstInvalidField ??= input; // Keep only the first invalid input for focus.
    } else { // Clear the accessible invalid state for valid fields.
      input.removeAttribute("aria-invalid"); // Remove a stale validation marker.
    } // Finish this field's validation updates.
  }); // Finish validating the required fields.

  if (firstInvalidField) {
    firstInvalidField.focus(); // Help the visitor reach the first field that needs correction.
    return;
  } // Continue only after all required fields pass.

  const name = formFields[0][0].value.trim();
  const email = formFields[1][0].value.trim();
  const message = formFields[2][0].value.trim();
  const inquiryType = contactPriority.value;
  const subject = encodeURIComponent(`Portfolio inquiry — ${inquiryType}`);
  const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nInquiry type: ${inquiryType}\n\n${message}`);
  formSuccess.textContent = "Your email application should open with the message prepared.";
  window.location.href = `mailto:davebarrerapadolina@gmail.com?subject=${subject}&body=${body}`;
});
