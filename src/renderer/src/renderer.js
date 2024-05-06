// @func init : Initializes the script to execute once the DOM content is loaded
function init() {
  // Add an event listener to execute when the DOM content is loaded
  window.addEventListener('DOMContentLoaded', () => {
    // Call the function doAThing once the DOM content is loaded
    doAThing()
  })
}

// @func encryptData : Encrypts data using AES-CBC algorithm with a password
// @param1 data : The data to be encrypted
// @param2 password : The password to encrypt the data
// @return : An object containing encrypted data, initialization vector (iv), and salt
async function encryptData(data, password) {
  // Create a text encoder
  const encoder = new TextEncoder();
  // Import the password as key material
  const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
  );
  // Generate a random salt
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  // Derive a key from the password and salt
  const key = await window.crypto.subtle.deriveKey(
      {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-CBC", length: 256 },
      false,
      ["encrypt"]
  );

  // Generate a random initialization vector (iv)
  const iv = window.crypto.getRandomValues(new Uint8Array(16));
  // Encode the data
  const encodedData = encoder.encode(data);
  // Encrypt the data using AES-CBC algorithm
  const encryptedData = await window.crypto.subtle.encrypt(
      {
          name: "AES-CBC",
          iv: iv,
      },
      key,
      encodedData
  );

  // Return an object containing encrypted data, iv, and salt
  return {
      encryptedData: new Uint8Array(encryptedData),
      iv: iv,
      salt: salt,
  };
}

// @func decryptData : Decrypts encrypted data using AES-CBC algorithm with a password
// @param1 encryptedData : The encrypted data to be decrypted
// @param2 password : The password to decrypt the data
// @param3 iv : The initialization vector used for encryption
// @param4 salt : The salt used for key derivation
// @return : The decrypted data
async function decryptData(encryptedData, password, iv, salt) {
  // Create a text encoder
  const encoder = new TextEncoder();
  // Import the password as key material
  const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
  );
  // Derive a key from the password and salt
  const key = await window.crypto.subtle.deriveKey(
      {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-CBC", length: 256 },
      false,
      ["decrypt"]
  );

  // Decrypt the encrypted data using AES-CBC algorithm
  const decryptedData = await window.crypto.subtle.decrypt(
      {
          name: "AES-CBC",
          iv: iv,
      },
      key,
      encryptedData
  );

  // Create a text decoder and decode the decrypted data
  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}

// @func binaryToBase64 : Converts binary data to base64 format
// @param1 binaryData : The binary data to be converted
// @return : The base64 representation of the binary data
function binaryToBase64(binaryData) {
  // Convert binary data to base64
  const base64 = btoa(
      new Uint8Array(binaryData).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
      )
  );
  return base64;
}

// @func base64ToBinary : Converts base64 data to binary format
// @param1 base64 : The base64 data to be converted
// @return : The binary representation of the base64 data
function base64ToBinary(base64) {
  // Convert base64 data to binary
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
// Get the modal element by its ID
var modal = document.getElementById("myModal");
// Get the button element by its ID used to trigger opening the modal
var newChatButton = document.getElementById("newchat-button");
// Get the close button element for the modal
var span = document.getElementsByClassName("close")[0];
// Get the save button element for the modal
var saveButton = document.getElementsByClassName("save-button")[0];
// Initialize a variable to store the name of the current note
var currentNoteName = "New Note";

// @func savechat : Saves the chat message entered in the modal
async function savechat() {
  // Get the current date
  var today = new Date();
  var day = today.getDate();
  var month = today.getMonth() + 1;
  var year = today.getFullYear();
  var formattedDate = month + "/" + day + "/" + year;
  // Get the value entered in the message input textbox
  let textbox_value = document.getElementById('message-input').value;
  // Split the message into lines
  const lines = textbox_value.split('\n');

  let slashCount = 0;

  // Count the number of slashes in the first line of the message
  for (let i = 0; i < lines[0].length; i++) {
      if (lines[0][i] === '/') {
          slashCount++;
      }
  }

  // Check if the first line contains exactly two '/' signs
  if (slashCount == 2) {
       // Remove the first two lines if they contain the date
       const remainingLines = lines.slice(2);
       textbox_value = remainingLines.join('\n');
  } else {
       // Log a message to the console if the first line does not contain two '/' signs
       console.log("The first line does not contain two '/' signs.");
  }
  
  // Add the current date and modified message back together
  let textbox_valueWithDate = formattedDate + "\n\n" + textbox_value;
 
  // Read file content and handle encryption and saving
  window.safenotes.read_file().then(async(data) => {
    console.log('Data received from main process:', data);
    let json = JSON.parse(data)

    // Encrypt the message content
    const { encryptedData, iv, salt } = await encryptData(textbox_valueWithDate, "password");
    // Store encrypted data along with IV and salt in JSON format
    json[currentNoteName] = {
      iv: binaryToBase64(iv),
      salt: binaryToBase64(salt),
      data: binaryToBase64(encryptedData)
    }

    // Write encrypted data to file
    window.safenotes.write_file(JSON.stringify(json))
  }).catch(err => {
    // Log an error message if there's an error during the process
    console.error('Error received from main process:', err);
  });
}

// Click event for the saveButton
saveButton.onclick = async function() {
  await savechat(); // Call the savechat function asynchronously
}

// Click event for the newChatButton
newChatButton.onclick = function() {
  modal.style.display = "block"; // Display the modal
}

// Click event for the span element to close the modal
span.onclick = function() {
  modal.style.display = "none"; // Hide the modal
}

// Click event to close the modal when clicked outside the modal
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none"; // Hide the modal if clicked outside
  }
}

// Click event for the submitNote button
document.getElementById("submitNote").onclick = function() {
  // Get the value of the noteName input field
  var noteName = document.getElementById("noteName").value;
  if (noteName) { // Check if noteName is not empty
    currentNoteName = noteName; // Set the currentNoteName to the entered noteName
    // Create a new list item for the note
    var newListItem = document.createElement('div');
    newListItem.className = 'list-item';
    // Set the inner HTML of the new list item
    newListItem.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-lock-2">
            <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v1"/>
            <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
            <rect width="8" height="5" x="2" y="13" rx="1"/>
            <path d="M8 13v-2a2 2 0 1 0-4 0v2"/>
        </svg>
        <h3>${noteName}</h3>
    `;
    // Append the new list item to the list container
    document.querySelector('.list-container').appendChild(newListItem);
    // Add click event listener to the new list item
    addClickListenerToListItem(newListItem, noteName);
    modal.style.display = "none"; // Hide the modal
    document.getElementById("message-input").value = ""; // Clear the message input field
  }
}

// Get the modal element with id "passwordModal"
var passModal = document.getElementById("passwordModal");
// Get the span element with class "passClose"
var passSpan = document.getElementsByClassName("passClose")[0];

// Close the modal when the span with class "passClose" is clicked
passSpan.onclick = function() {
  passModal.style.display = "none";
}

// Close the modal when clicked outside the modal
window.onclick = function(event) {
  if (event.target == passModal) {
    passModal.style.display = "none";
  }
}

// Function to add a click event listener to a list item
function addClickListenerToListItem(listItem, noteName) {
  // When a list item is clicked, display the password modal and set the current note name
  listItem.addEventListener('click', function() {
    passModal.style.display = "block";
    currentNoteName = noteName; // Assuming currentNoteName is a global variable
  });
}

// Function to create list items based on notes data
function createListItems(notes) {
  // Get the container for the list
  const listContainer = document.querySelector('.list-container');

  // Loop through each note
  for (const noteName in notes) {
      // Create a new div element for the list item
      const listItem = document.createElement('div');
      listItem.className = 'list-item';
      // Set inner HTML of the list item
      listItem.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-lock-2">
              <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v1"/>
              <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
              <rect width="8" height="5" x="2" y="13" rx="1"/>
              <path d="M8 13v-2a2 2 0 1 0-4 0v2"/>
          </svg>
          <h3>${noteName}</h3>
      `;
      // Append the list item to the list container
      listContainer.appendChild(listItem);
      // Add click event listener to the list item
      addClickListenerToListItem(listItem, noteName);
  }
}


// This function is assigned to the click event of an element with the id "submitPass"
document.getElementById("submitPass").onclick = async function() {
  // Get the value of an element with the id "notePass"
  var notePass = document.getElementById("notePass").value;
  if (notePass) { // Check if notePass is not empty
     // Assuming currentNoteName is set somewhere in your code
     // Read a file asynchronously
     window.safenotes.read_file().then(async(data) => {
       // Parse the JSON data retrieved from the file
       let json = JSON.parse(data);
       console.log(currentNoteName); // Log the currentNoteName
 
       if (json[currentNoteName]) { // Check if the JSON data contains the current note
         var x = json[currentNoteName]; // Retrieve the note data
         console.log(x); // Log the note data
 
         // Convert Base64 encoded strings to Binary
         const encryptedDataBinary = base64ToBinary(x.data);
         const ivBinary = base64ToBinary(x.iv);
         const saltBinary = base64ToBinary(x.salt);
 
         // Decrypt the data using the provided password
         try {
           const decryptedData = await decryptData(encryptedDataBinary, notePass, ivBinary, saltBinary);
           // Set the value of an element with the id "message-input" to the decrypted data
           document.getElementById('message-input').value = decryptedData
           console.log("Decrypted Data:", decryptedData); // Log the decrypted data
         } catch (error) {
           console.error("Decryption failed:", error); // Log decryption error
         }
       } else {
         console.error("Note does not exist!"); // Log if the note doesn't exist
       }
     }).catch(err => {
       console.error('error received from main process:', err); // Log any errors from reading the file
     });
     passModal.style.display = "none"; // Hide the password modal
  }
 }

// This function is called to do a certain action
function doAThing() {
  // Retrieve Electron, Chromium, and Node.js versions and display them
  const versions = window.electron.process.versions
  replaceText('.electron-version', `Electron v${versions.electron}`)
  replaceText('.chrome-version', `Chromium v${versions.chrome}`)
  replaceText('.node-version', `Node v${versions.node}`)

  // Add event listener to a button with id "ipcHandler" to send a ping message
  const ipcHandlerBtn = document.getElementById('ipcHandler')
  ipcHandlerBtn?.addEventListener('click', () => {
    window.electron.ipcRenderer.send('ping')
  })

  // Read a file asynchronously and create list items based on the JSON data
  window.safenotes.read_file().then(async(data) => {
    let json = JSON.parse(data)
    createListItems(json)
  })
}

// Function to replace the text content of an element selected by the given selector
function replaceText(selector, text) {
  const element = document.querySelector(selector)
  if (element) {
    element.innerText = text
  }
}

// Initalize the APP
init()