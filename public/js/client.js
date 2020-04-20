var socket = io();

socket.on("process-started", function () {
  let loader = document.createElement("div");
  loader.classList.add("lds-hourglass");
  loader.classList.add("loader-center");
  document.body.appendChild(loader);

  let startButton = document.querySelector("#start");
  start.classList.add("disabled");
  start.disabled = true;
});

socket.on("pdf-generated", (arg) => {
  let li = document.createElement("li");
  let signDiv = document.createElement("div");
  signDiv.classList.add("sign_div");
  let signImg = document.createElement("img");
  signImg.setAttribute("type", "images/svg");
  signImg.setAttribute("src", "http://localhost:4600/images/check.svg");
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

socket.on("pdf-error", (arg) => {
  let li = document.createElement("li");
  li.classList.add("error");
  let signDiv = document.createElement("div");
  signDiv.classList.add("sign_div");
  let signImg = document.createElement("img");
  signImg.setAttribute("type", "images/svg");
  signImg.setAttribute("src", "http://localhost:4600/images/cross.svg");
  signImg.setAttribute("alt", "sign image");
  signDiv.appendChild(signImg);
  let messageDiv = document.createElement("div");
  let messageTextNode = document.createTextNode(
    `Error : ${arg.message} while downloading pdf for consumer ${arg.consumer}`
  );
  messageDiv.appendChild(messageTextNode);
  li.appendChild(signDiv);
  li.appendChild(messageDiv);
  document.querySelector("#error-list").appendChild(li);
});

function emitResoponseEvent() {
  socket.emit("response-from-user");
}

socket.on("waiting-for-user", function () {
  let button = document.createElement("button");
  let buttonTextNode = document.createTextNode(`Process Completed`);
  button.classList.add("complete-button");
  button.appendChild(buttonTextNode);
  button.addEventListener("click", emitResoponseEvent);
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
  signImg.setAttribute("src", "http://localhost:4600/images/cross.svg");
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
  
  let completeButton = document.querySelector(".complete-button");
  completeButton && completeButton.removeEventListener("click", emitResoponseEvent);
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
  start.classList.remove("disabled");
  start.disabled = false;
});

async function uploadFile() {
  let formData = new FormData();
  let excel = document.getElementById("excel_file").files[0];
  formData.append("excel", excel);
  // formData.append("downloadPath", downloadPath);

  try {
    let r = await fetch("/file", { method: "POST", body: formData });
    console.log("HTTP response code:", r.status);
  } catch (e) {
    console.log("Huston we have problem...:", e);
  }
}
