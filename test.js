"use strict";

const form = document.querySelector(".form");
const userInput = document.querySelector(".userInput");
const userInputHeading = document.querySelector(".userInputHeading");
const tasksContainer = document.querySelector(".tasks");
const clearAll = document.querySelector(".clearAll");
const menuIcon = document.querySelector(".menuIcon");
const aside = document.querySelector(".tasksContainer");
// const deleteButton = document.querySelector(".trashIcon");

//Mobile queries
// console.log(screen.width);
var windowWidth = 0;
if (screen.width > 425) {
  aside.classList.remove("transform");
} else {
  aside.classList.add("transform");
}

const mobileOperations = function () {
  menuIcon.addEventListener("click", function () {
    aside.classList.toggle("transform");
  });
};
window.onload = mobileOperations;

class Task {
  #date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(task, taskHeading, coords) {
    this.coords = coords;
    this.task = task;
    this.taskHeading = taskHeading;
  }
}
// console.log(screen.width);
class App {
  #map;
  #tasks = [];
  #mapEvent;
  #markers = [];
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener("submit", this._newTask.bind(this));
    tasksContainer.addEventListener("click", this._moveToPopup.bind(this));
    tasksContainer.addEventListener("click", this._removeTask.bind(this));
    clearAll.addEventListener("click", this._reset);
    // console.log(this.#tasks.length);
    if (this.#tasks.length === 0) {
      clearAll.classList.add("hidden");
    }
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
      alert("Location permission denied");
    });
  }

  _loadMap(position) {
    const { latitude: lat, longitude: lng } = position.coords;
    const coords = [lat, lng];
    this.#map = L.map("map").setView(coords, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    //Map event listner
    this.#map.on("click", this._showForm.bind(this));
    this.#tasks.forEach((task) => {
      this._renderMarker(task);
    });
  }

  _showForm(position) {
    this.#mapEvent = position;
    form.classList.remove("hide");
    if (screen.width < 426) {
      aside.classList.remove("transform");
    } else {
      userInputHeading.focus();
    }
  }

  _formHide() {
    form.style.display = "none";
    form.classList.add("hide");
    setTimeout(() => (form.style.display = "flex"), 1000);
  }

  _newTask(e) {
    e.preventDefault();

    const { lat, lng } = this.#mapEvent.latlng;
    //Taking task Input
    const taskDesc = userInput.value;
    const taskHeading = userInputHeading.value;
    const task = new Task(taskDesc, taskHeading, [lat, lng]);
    this.#tasks.push(task);

    //Emptying input
    userInput.value = userInputHeading.value = "";

    //Rendering
    this._renderMarker(task);
    this._renderTask(task);
    //Hiding form
    this._formHide();

    //Displaying clearAll
    clearAll.classList.remove("hidden");
    //Setting local storage
    this._setLocalStorage();
    if (screen.width < 426) {
      aside.classList.add("transform");
    }
  }

  _renderMarker(task) {
    const marker = L.marker(task.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          // maxWidth: 250,
          minWidth: 100,
          closeButton: false,
          autoClose: false,
          closeOnClick: false,
          className: "popUp",
        })
      )
      .setPopupContent(`📋${task.task}`)
      .openPopup();
    this.#markers.push(marker);
    // console.log(this.#markers);
  }

  _renderTask(task) {
    const html = `
    <div class="task" data-id="${task.id}">
      <h2 class="taskHeading">${task.taskHeading}</h2>
      <p class="taskDesc">${task.task}</p>
      <div class="iconTrashBox">
      <svg
        class="trashIcon"
        xmlns="http://www.w3.org/2000/svg"
        x="0px"
        y="0px"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        style="fill: #26e07f"
      >
        <path
          d="M 10 2 L 9 3 L 4 3 L 4 5 L 5 5 L 5 20 C 5 20.522222 5.1913289 21.05461 5.5683594 21.431641 C 5.9453899 21.808671 6.4777778 22 7 22 L 17 22 C 17.522222 22 18.05461 21.808671 18.431641 21.431641 C 18.808671 21.05461 19 20.522222 19 20 L 19 5 L 20 5 L 20 3 L 15 3 L 14 2 L 10 2 z M 7 5 L 17 5 L 17 20 L 7 20 L 7 5 z M 9 7 L 9 18 L 11 18 L 11 7 L 9 7 z M 13 7 L 13 18 L 15 18 L 15 7 L 13 7 z"
        ></path>
      </svg>
    </div>
    </div>
    `;
    tasksContainer.insertAdjacentHTML("beforeend", html);
  }

  _removeTask(e) {
    const taskToDelete = e.target.closest(".trashIcon");
    if (!taskToDelete) return;
    const element = taskToDelete.parentElement.parentElement;
    const elementId = element.dataset.id;
    element.remove();
    this.#tasks.forEach((task, ind, obj) => {
      if (task.id === elementId) {
        obj.splice(ind, 1);
        this.#map.removeLayer(this.#markers[ind]);
        this.#markers.splice(ind, 1);
        if (this.#tasks.length === 0) {
          clearAll.classList.add("hidden");
        }
      }
    });
    this._setLocalStorage();
  }

  _moveToPopup(e) {
    if (screen.width < 426) {
      aside.classList.add("transform");
    }
    const taskToMove = e.target.closest(".task");
    if (!taskToMove) return;
    const task = this.#tasks.find((task) => task.id === taskToMove.dataset.id);
    // console.log(task);
    this.#map.setView(task.coords, 14, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem("tasks", JSON.stringify(this.#tasks));
  }

  _getLocalStorage() {
    const tasksFromLocalStorage = JSON.parse(localStorage.getItem("tasks"));
    if (!tasksFromLocalStorage) return;
    this.#tasks = tasksFromLocalStorage;
    this.#tasks.forEach((task) => {
      this._renderTask(task);
    });
  }

  _reset() {
    localStorage.removeItem("tasks");
    location.reload();
  }
}
const app = new App();
