function init() {
  window.addEventListener('DOMContentLoaded', () => {
    doAThing()
  })
}


async function encryptData(data, password) {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
  );
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
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

  const iv = window.crypto.getRandomValues(new Uint8Array(16));
  const encodedData = encoder.encode(data);
  const encryptedData = await window.crypto.subtle.encrypt(
      {
          name: "AES-CBC",
          iv: iv,
      },
      key,
      encodedData
  );

  return {
      encryptedData: new Uint8Array(encryptedData),
      iv: iv,
      salt: salt,
  };
}

async function decryptData(encryptedData, password, iv, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
  );
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

  const decryptedData = await window.crypto.subtle.decrypt(
      {
          name: "AES-CBC",
          iv: iv,
      },
      key,
      encryptedData
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}

function binaryToBase64(binaryData) {
  const base64 = btoa(
      new Uint8Array(binaryData).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
      )
  );
  return base64;
}

function base64ToBinary(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

(async () => {
  const password = "yourPasswordHere";
  const data = "This is a secret message";

  const { encryptedData, iv, salt } = await encryptData(data, password);
  console.log("Encrypted Data:", binaryToBase64(encryptedData));

  const decryptedData = await decryptData(base64ToBinary(binaryToBase64(encryptedData)), password, iv, salt);
  console.log("Decrypted Data:", decryptedData);
})();

var modal = document.getElementById("myModal");
var newChatButton = document.getElementById("newchat-button");
var span = document.getElementsByClassName("close")[0];
var saveButton = document.getElementsByClassName("save-button")[0];
var currentNoteName = "New Note"
async function savechat() {
  console.log("simon har en stor svart dase")
  let textbox_value = document.getElementById('message-input').value

  //window.safenotes.write_file("hej, simon har en liten svart dase")4
  window.safenotes.read_file().then(async(data) => {
    console.log('Data received from main process:', data);
    let json = JSON.parse(data)

    if(!json[currentNoteName])
    {
      const { encryptedData, iv, salt } = await encryptData(data, "test");
      json[currentNoteName] = {
        iv: binaryToBase64(iv),
        salt: binaryToBase64(salt),
        data: binaryToBase64(encryptedData)
      }

      window.safenotes.write_file(JSON.stringify(json))
    }
    else
    {
      console.error("Already exists!")
    }
   }).catch(err => {
    console.error('Error received from main process:', err);
   });

}
saveButton.onclick = async function() {
  await savechat()
}
newChatButton.onclick = function() {
 modal.style.display = "block";
}

span.onclick = function() {
 modal.style.display = "none";
}

window.onclick = function(event) {
 if (event.target == modal) {
    modal.style.display = "none";
 }
}

document.getElementById("submitNote").onclick = function() {
 var noteName = document.getElementById("noteName").value;
 if (noteName) {
    currentNoteName = noteName
    var newListItem = document.createElement('div');
    newListItem.className = 'list-item';
    newListItem.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-lock-2">
            <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v1"/>
            <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
            <rect width="8" height="5" x="2" y="13" rx="1"/>
            <path d="M8 13v-2a2 2 0 1 0-4 0v2"/>
        </svg>
        <h3>${noteName}</h3>
    `;
    document.querySelector('.list-container').appendChild(newListItem);
    addClickListenerToListItem(newListItem, noteName);
    modal.style.display = "none";
    document.getElementById("message-input").value = "";
 }
}

var passModal = document.getElementById("passwordModal");
var passSpan = document.getElementsByClassName("passClose")[0];


passSpan.onclick = function() {
  passModal.style.display = "none";
}
 
 window.onclick = function(event) {
  if (event.target == passModal) {
    passModal.style.display = "none";
  }
}


function addClickListenerToListItem(listItem, noteName) {
  listItem.addEventListener('click', function() {
    passModal.style.display = "block";
  });
}


function createListItems(notes) {
  const listContainer = document.querySelector('.list-container');

  for (const noteName in notes) {
      const listItem = document.createElement('div');
      listItem.className = 'list-item';
      listItem.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-lock-2">
              <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v1"/>
              <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
              <rect width="8" height="5" x="2" y="13" rx="1"/>
              <path d="M8 13v-2a2 2 0 1 0-4 0v2"/>
          </svg>
          <h3>${noteName}</h3>
      `;
      listContainer.appendChild(listItem);
      addClickListenerToListItem(listItem, noteName);
  }
}

document.getElementById("submitPass").onclick = function() {
  var notePass = document.getElementById("notePass").value;
  if (notePass) {
    passModal.style.display = "none";
    // ATT GÖRA: Hämta JSON-filen, hitta password och h3, se om det stämmer. Isåfall ladda in innehållet och dekryptera.
  }
 }
 


function doAThing() {
  const versions = window.electron.process.versions
  replaceText('.electron-version', `Electron v${versions.electron}`)
  replaceText('.chrome-version', `Chromium v${versions.chrome}`)
  replaceText('.node-version', `Node v${versions.node}`)

  const ipcHandlerBtn = document.getElementById('ipcHandler')
  ipcHandlerBtn?.addEventListener('click', () => {
    window.electron.ipcRenderer.send('ping')
  })

  window.safenotes.read_file().then(async(data) => {
    console.log('Data received from main process:', data);
    let json = JSON.parse(data)
    createListItems(json)
  })
}

function replaceText(selector, text) {
  const element = document.querySelector(selector)
  if (element) {
    element.innerText = text
  }
}



init()