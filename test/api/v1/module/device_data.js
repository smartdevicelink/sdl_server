let devices = {
  "device1": {
    "carrier": "AT&T",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  },
  "device2": {
    "carrier": "AT&T",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  },
  "device3": {
    "carrier": "AT&T",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  },
  "device4": {
    "carrier": "AT&T",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  },
  "device5": {
    "carrier": "AT&T",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  },
  "device6": {
    "carrier": "AT&T",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  },
  "device7": {
    "carrier": "Verison",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  },
  "device8": {
    "carrier": "Verison",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  },
  "device9": {
    "carrier": "Verison",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  },
  "device10": {
    "carrier": "Verison",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  },
  "device11": {
    "carrier": "Verison",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  },
  "device12": {
    "carrier": "Verison",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  },
  "device13": {
    "carrier": "Verison",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  },
  "device14": {
    "carrier": "Verison",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  },
  "device15": {
    "carrier": "Verison",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  },
  "device16": {
    "carrier": "Verison",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  },
  "device17": {
    "carrier": "Verison",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  }
};


for (let i = 0; i < 5; i++)
{
  devices[`device--${i}`] = {
    "carrier": `Carrier ${i}`,
    "connection_type": "BTMAC",
    "hardware": `Model ${i}`,
    "os": "iOS",
    "os_version": "8.1.0"
  }
}

for (let i = 0; i < 20; i++)
{
  devices[`device-${i}`] = {
    "carrier": `Sprint`,
    "connection_type": "BTMAC",
    "hardware": `Model ${i}`,
    "os": "iOS",
    "os_version": "8.1.0"
  }
}


module.exports = devices;
