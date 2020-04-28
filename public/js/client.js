var socket = io();

function toggleModal() {
  let modal = document.querySelector(".info-modal");
  let startButton = document.querySelector("#start");
  startButton.classList.toggle("disabled");
  startButton.disabled = !startButton.disabled;
  modal.classList.toggle("hide-modal");
}

socket.on("process-started", function () {
  let loader = document.createElement("div");
  loader.classList.add("lds-hourglass");
  loader.classList.add("loader-center");
  document.body.appendChild(loader);

  let startButton = document.querySelector("#start");
  startButton.classList.add("disabled");
  startButton.disabled = true;

  let infoButton = document.querySelector(".info-button");
  infoButton.classList.add("disabled");
  infoButton.disabled = true;
});

socket.on("pdf-generated", (arg) => {
  let li = document.createElement("li");
  let signDiv = document.createElement("div");
  signDiv.classList.add("sign_div");
  let signImg = document.createElement("img");
  signImg.setAttribute("type", "images/svg");
  signImg.setAttribute("src", "images/check.svg");
  signImg.setAttribute("alt", "sign image");
  signDiv.appendChild(signImg);
  let messageDiv = document.createElement("div");
  let messageTextNode = document.createTextNode(
    `Pdf generated for ${arg.billMonth} for consumer ${arg.consumer}`
  );
  messageDiv.appendChild(messageTextNode);
  li.appendChild(signDiv);
  li.appendChild(messageDiv);
  document.querySelector("#success-list").appendChild(li);
});

socket.on("pdf-error", (message) => {
  let li = document.createElement("li");
  li.classList.add("error");
  let signDiv = document.createElement("div");
  signDiv.classList.add("sign_div");
  let signImg = document.createElement("img");
  signImg.setAttribute("type", "images/svg");
  signImg.setAttribute("src", "images/cross.svg");
  signImg.setAttribute("alt", "sign image");
  signDiv.appendChild(signImg);
  let messageDiv = document.createElement("div");
  let messageTextNode = document.createTextNode(`Error : ${message}`);
  messageDiv.appendChild(messageTextNode);
  li.appendChild(signDiv);
  li.appendChild(messageDiv);
  document.querySelector("#error-list").appendChild(li);
});

function emitResoponseEvent() {
  socket.emit("response-from-user");
}

socket.on("wait-for-user", function (buttonText, name) {
  buttonText = buttonText || "Process Completed";

  let button = document.createElement("button");
  button.classList.add("complete-button");
  button.addEventListener("click", emitResoponseEvent);

  if (buttonText == "Process Completed") {
    let buttonTextNode = document.createTextNode(buttonText);
    button.appendChild(buttonTextNode);
    document.querySelector("body").appendChild(button);
  } else {
    button.style.padding = "0";
    let anchorNode = document.createElement("a");
    anchorNode.addEventListener("onclick", emitResoponseEvent);
    anchorNode.setAttribute("href", `/generated_-_bills.zip`);
    button.classList.add("download");
    anchorNode.style.display = "inline-block";
    anchorNode.style.padding = "1rem 1.6rem";
    let anchorTextNode = document.createTextNode(buttonText);
    anchorNode.appendChild(anchorTextNode);
    button.appendChild(anchorNode);
  }
  document.querySelector("body").appendChild(button);

  let loader = document.body.querySelector(".lds-hourglass");
  loader && loader.parentElement.removeChild(loader);
});

socket.on("file-error", function (error) {
  let ul = document.createElement("ul");
  ul.setAttribute("id", "pdf-error");

  let li = document.createElement("li");
  li.classList.add("error");
  let signDiv = document.createElement("div");
  signDiv.classList.add("sign_div");
  let signImg = document.createElement("img");
  signImg.setAttribute("type", "images/svg");
  signImg.setAttribute("src", "/images/cross.svg");
  signImg.setAttribute("alt", "sign image");
  signDiv.appendChild(signImg);
  let messageDiv = document.createElement("div");
  let messageTextNode = document.createTextNode(`Error : ${error}`);
  messageDiv.appendChild(messageTextNode);
  li.appendChild(signDiv);
  li.appendChild(messageDiv);
  ul.appendChild(li);

  document.querySelector("body").appendChild(ul);
});

socket.on("perform-cleanup", function () {
  let pdfError = document.querySelector("#pdf-error");
  pdfError && pdfError.parentNode.removeChild(pdfError);

  let fileInput = document.querySelector("input[type='file'");
  let emptyFile = document.createElement("input");
  emptyFile.type = "file";
  fileInput.files = emptyFile.files;

  let completeButton = document.querySelector(".complete-button");
  completeButton &&
    completeButton.removeEventListener("click", emitResoponseEvent);
  let anchorNode = document.querySelector("a");
  anchorNode && anchorNode.removeEventListener("onclick", emitResoponseEvent);
  completeButton && completeButton.parentNode.removeChild(completeButton);
  let successList = document.querySelector("#success-list");
  if (successList) {
    while (successList.hasChildNodes()) {
      successList.removeChild(successList.childNodes[0]);
    }
  }
  let errorList = document.querySelector("#error-list");
  if (errorList) {
    while (errorList.hasChildNodes()) {
      errorList.removeChild(errorList.childNodes[0]);
    }
  }

  let startButton = document.querySelector("#start");
  startButton.classList.remove("disabled");
  startButton.disabled = false;

  let infoButton = document.querySelector(".info-button");
  infoButton.classList.remove("disabled");
  infoButton.disabled = false;
});

async function uploadFile() {
  let formData = new FormData();
  let excel = document.getElementById("excel_file").files[0];
  formData.append("excel", excel);

  try {
    let r = await fetch("/file", { method: "POST", body: formData });
    console.log("HTTP response code:", r.status);
  } catch (e) {
    console.log("Huston we have problem...:", e);
  }
}
