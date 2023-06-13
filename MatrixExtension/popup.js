document.addEventListener("DOMContentLoaded", function () {
  const generateButton = document.getElementById("generateButton");
  const iso2codeInput = document.getElementById("iso2code");
  const phoneNumberInput = document.getElementById("phoneNumber");
  const ipInput = document.getElementById("ip");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const countryInput = document.getElementById("country");
  const refererInput = document.getElementById("referer");

  // Retrieve saved input values from localStorage
  phoneNumberInput.value = localStorage.getItem("phoneNumber") || "";
  ipInput.value = localStorage.getItem("ip") || "";
  nameInput.value = localStorage.getItem("name") || "";
  emailInput.value = localStorage.getItem("email") || "";
  countryInput.value = localStorage.getItem("country") || "";
  refererInput.value = localStorage.getItem("referer") || "";

  const savedIso2Code = localStorage.getItem("iso2code");
  if (savedIso2Code) {
    iso2codeInput.value = savedIso2Code;
  }

  generateButton.addEventListener("click", generateData);
  iso2codeInput.addEventListener("keydown", handleEnterKeyPress);
  document.addEventListener("keypress", handleEnterKeyPress);

  function handleEnterKeyPress(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      generateData();
      localStorage.setItem("iso2code", iso2codeInput.value.toUpperCase());
    }
  }

  function generateData() {
    const iso2code = iso2codeInput.value.toUpperCase();
    if (!iso2code) {
      alert("Please enter an ISO2 code");
      return;
    }

    fetch(`http://localhost:3000/generate/${iso2code}`)
      .then((response) => response.json())
      .then((data) => {
        phoneNumberInput.value = data.phoneNumber;
        ipInput.value = data.ip;
        nameInput.value = generateNameData();
        emailInput.value = generateEmailData(nameInput.value);
        countryInput.value = iso2code;
        refererInput.value = "https://google.com";

        // Save the input values to localStorage
        localStorage.setItem("phoneNumber", data.phoneNumber);
        localStorage.setItem("ip", data.ip);
        localStorage.setItem("name", nameInput.value);
        localStorage.setItem("email", emailInput.value);
        localStorage.setItem("country", iso2code);
        localStorage.setItem("referer", refererInput.value);
        localStorage.setItem("iso2code", iso2code);

        // Inject the generated data into the webpage's input fields
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          // Get the tab object
          const tab = tabs[0];

          // Execute a content script in the active tab
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: injectInputText,
            args: [
              data.phoneNumber,
              data.ip,
              nameInput.value,
              emailInput.value,
              iso2code,
              refererInput.value,
            ],
          });
        });
      })
      .catch((error) => {
        console.error(error);
        alert("Error generating data");
      });
  }

  function generateNameData() {
    const randomChars = generateRandomChars(4);
    return `test${randomChars} test${randomChars}`;
  }

  function generateEmailData(name) {
    const domain = Math.random() < 0.5 ? "@gmail.com" : "@yahoo.com";
    return name.replace(/\s/g, "") + domain;
  }

  function generateRandomChars(length) {
    let result = "";
    const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }

    return result;
  }

  function injectInputText(phoneNumber, ip, name, email, country, referer) {
    const phoneNumberInput = document.querySelector('input[name="phone"]');
    const ipInput = document.querySelector('input[name="ip"]');
    const nameInput = document.querySelector('input[name="name"]');
    const emailInput = document.querySelector('input[name="email"]');
    const countryInput = document.querySelector('input[name="country"]');
    const refererInput = document.querySelector('input[name="referer"]');

    // Check if the input fields are found
    if (
      phoneNumberInput &&
      ipInput &&
      nameInput &&
      emailInput &&
      countryInput &&
      refererInput
    ) {
      phoneNumberInput.value = phoneNumber;
      ipInput.value = ip;
      nameInput.value = name;
      emailInput.value = email;
      countryInput.value = country;
      refererInput.value = referer;
    }
  }
});
