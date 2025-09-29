import type { Element } from "@b-fuze/deno-dom/wasm-noinit";

function processInputElement(
  el: Element,
  formData: FormData,
  submitter?: Element,
) {
  const name = el.getAttribute("name");
  if (!name || el.getAttribute("disabled") !== null) {
    // skip unnamed or disabled
    return;
  }

  const tag = el.tagName?.toLowerCase();
  const type = el.getAttribute("type")?.toLowerCase();

  if (tag === "input") {
    if (type === "checkbox" || type === "radio") {
      if (el.getAttribute("checked") !== null) {
        formData.append(name, el.getAttribute("value") ?? "on");
      }
    } else if (type === "file") {
      throw new Error("File inputs are not supported.");
    } else if (type === "submit" || type === "button" || type === "reset") {
      if (el === submitter) {
        formData.append(name, el.getAttribute("value") ?? "");
      }
    } else {
      formData.append(name, el.getAttribute("value") ?? "");
    }
  } else if (tag === "select") {
    // For select, get selected options
    const options = Array.from(el.querySelectorAll("option"));

    if (el.getAttribute("multiple") !== null) {
      for (const option of options) {
        if (option.getAttribute("selected") !== null) {
          formData.append(name, option.getAttribute("value") ?? "");
        }
      }
      // If none selected, browser does not submit anything for multiple selects
    } else {
      let selectedOption = options.find(
        (option) => option.getAttribute("selected") !== null,
      );
      if (!selectedOption && options.length > 0) {
        // No option selected, use first option as per browser behavior
        selectedOption = options[0];
      }
      if (selectedOption) {
        formData.append(name, selectedOption.getAttribute("value") ?? "");
      }
    }
  } else if (tag === "textarea") {
    let value = el.textContent ?? "";
    // Normalize line breaks to CRLF like browsers
    value = value.replace(/\n/g, "\r\n");
    formData.append(name, value);
  }
}

export function buildFormData(
  formElement: Element,
  submitter?: Element,
): FormData {
  const formData = new FormData();

  // Process all form controls inside the form
  for (const el of formElement.querySelectorAll("input, select, textarea")) {
    processInputElement(el, formData, submitter);
  }

  // Include form-associated elements outside the <form> like browsers do
  const formId = formElement.getAttribute("id");
  if (formId) {
    for (
      const el of formElement.ownerDocument?.querySelectorAll(
        `[form="${formId}"]`,
      ) ?? []
    ) {
      // run the same logic as for in-form controls
      processInputElement(el, formData, submitter);
    }
  }

  return formData;
}
