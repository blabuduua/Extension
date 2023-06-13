const express = require("express");
const PhoneNumber = require("libphonenumber-js");
const app = express();
const fs = require("fs");
const cors = require("cors");
const countryCodes = require('./countryCodes');

app.use(cors());

function getRandomIP(ips) {
  const randomIndex = Math.floor(Math.random() * ips.length);
  return ips[randomIndex];
}

function getRandomIPWithiso2code(iso2code, callback) {
  fs.readFile("IP2LOCATION-LITE-DB1.CSV", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading the CSV file:", err);
      return callback(err);
    }

    const rows = data.split("\n");
    const ipData = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].split(",");

      if (row.length === 4) {
        const ipFrom = row[0].replace(/"/g, "");
        const ipTo = row[1].replace(/"/g, "");
        const country_code = row[2].replace(/"/g, "");

        ipData.push({
          ip_from: ipFrom,
          ip_to: ipTo,
          country_code: country_code,
        });
      }
    }

    const ips = generateIPsForiso2code(ipData, iso2code);
    const randomIP = getRandomIP(ips, iso2code);
    callback(null, randomIP);
  });
}

function generateIPsForiso2code(data, iso2code) {
  const ips = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    if (row.country_code === iso2code) {
      const ipFrom = row.ip_from;
      const ipTo = row.ip_to;

      const randomIP = generateRandomIP(ipFrom, ipTo, iso2code);
      ips.push(randomIP);
    }
  }

  return ips;
}

function generateRandomIP(ipFrom, ipTo, iso2code) {
  const minIP = BigInt(ipFrom);
  const maxIP = BigInt(ipTo);

  const range = maxIP - minIP + BigInt(1);
  const randomOffset = BigInt(Math.floor(Math.random() * Number(range)));

  const generatedIP = (minIP + randomOffset).toString();

  const parts = [];
  let remaining = BigInt(generatedIP);
  for (let i = 0; i < 4; i++) {
    parts.unshift((remaining & BigInt(255)).toString());
    remaining >>= BigInt(8);
  }

  return {
    ip: parts.join("."),
    iso2code: iso2code,
  };
}

function generateRandomPhoneNumber(iso2code) {
  let phoneNumber = "";
  const countryCodeFormat = countryCodes[iso2code.toUpperCase()];
  if (countryCodeFormat) {
    phoneNumber = countryCodeFormat.replace(/X/g, () =>
      Math.floor(Math.random() * 10)
    );
    phoneNumber = phoneNumber.replace(
      /N/g,
      () => Math.floor(Math.random() * 9) + 1
    );
  } else {
    phoneNumber = "Unknown country code";
  }
  return phoneNumber;
}

function validatePhoneNumber(phoneNumber) {
  try {
    const parsedPhoneNumber =
      PhoneNumber.parsePhoneNumberFromString(phoneNumber);
    return parsedPhoneNumber.isValid();
  } catch (error) {
    return false;
  }
}

app.get("/generate/:iso2code", (req, res) => {
  const iso2code = req.params.iso2code.toLocaleUpperCase();
  let attempts = 0;

  function generatePhoneNumberAndValidate() {
    const phoneNumber = generateRandomPhoneNumber(iso2code);
    const isValid = validatePhoneNumber(phoneNumber);

    if (!isValid && attempts < 10000) {
      attempts++;
      generatePhoneNumberAndValidate(); // Retry with a new phone number
    } else if (!isValid && attempts === 10000) {
      res.status(500).send("Maximum attempts reached");
    } else {
      getRandomIPWithiso2code(iso2code, (err, randomIP) => {
        if (err) {
          res.status(500).send("Error generating random IP");
        } else {
          // Remove symbols except integers from the phoneNumber
          const cleanedPhoneNumber = phoneNumber.replace(/\D/g, "");
          
          res.json({
            phoneNumber: cleanedPhoneNumber,
            ip: randomIP.ip,
            iso2code: randomIP.iso2code,
          });
        }
      });
    }
  }

  generatePhoneNumberAndValidate();
});


app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
