"use strict";

var client = contentful.createClient({
  space: "ke0oshiiblfc",
  accessToken: "cgVRfs2SbmuadP9cC42NO1i1DUIg_YNJBW78YTj4CQ0",
});

var tinderContainer = document.querySelector(".tinder");
var tinderButtons = document.querySelector(".tinder--buttons");
var allCards;
var nope = document.getElementById("nope");
var love = document.getElementById("love");
const contactForm = document.querySelector(".contact-form");
const thanksModalWrapper = document.querySelector(".thanks-model-wrapper");
thanksModalWrapper.style.display = "none";
var userResponses = [];

client
  .getEntries({
    content_type: "questions",
  })
  .then(function (response) {
    createQuestionCards(response.items);
    allCards = document.querySelectorAll(".tinder--card");
    initCards();
    attachSwipeListeners();
  })
  .catch(function (error) {
    console.error("Error fetching entries:", error);
  });

client
  .getEntries({
    content_type: "contactFormContent",
  })
  .then(function (response) {
    if (response.items.length > 0) {
      updateContactForm(response.items[0]);
    }
  })
  .catch(function (error) {
    console.error("Error fetching contact form content:", error);
  });

function updateContactForm(formData) {
  const header = document.querySelector(".contact-form header p");
  const headerImg = document.querySelector(".contact-form header img");
  const descriptionText = document.querySelector(
    ".contact-form .text p:first-of-type"
  );

  header.textContent = formData.fields.heading;

  if (formData.fields.image && formData.fields.image.fields.file) {
    headerImg.src = formData.fields.image.fields.file.url;
  }

  descriptionText.textContent = formData.fields.description;
}

function createQuestionCards(questions) {
  const cardsContainer = document.querySelector(".tinder--cards");

  questions.forEach((question, index) => {
    const card = document.createElement("div");
    card.className = "tinder--card";

    const questionText = question.fields.question;
    card.setAttribute("data-question", questionText);

    const img = document.createElement("img");
    img.src = question.fields.image.fields.file.url;

    const h3 = document.createElement("h3");
    h3.textContent = question.fields.question;

    card.appendChild(img);
    card.appendChild(h3);

    cardsContainer.appendChild(card);
  });
}

function initCards() {
  var newCards = document.querySelectorAll(".tinder--card:not(.removed)");

  newCards.forEach(function (card, index) {
    card.style.zIndex = allCards.length - index;
  });

  tinderContainer.classList.add("loaded");
}

function attachSwipeListeners() {
  allCards.forEach(function (el) {
    var hammertime = new Hammer(el);

    hammertime.on("pan", function (event) {
      el.classList.add("moving");
      tinderContainer.classList.toggle("tinder_love", event.deltaX > 0);
      tinderContainer.classList.toggle("tinder_nope", event.deltaX < 0);

      var xMulti = event.deltaX * 0.03;
      var yMulti = event.deltaY / 80;
      var rotate = xMulti * yMulti;

      event.target.style.transform =
        "translate(" +
        event.deltaX +
        "px, " +
        event.deltaY +
        "px) rotate(" +
        rotate +
        "deg)";
    });

    hammertime.on("panend", function (event) {
      el.classList.remove("moving");
      tinderContainer.classList.remove("tinder_love");
      tinderContainer.classList.remove("tinder_nope");

      var moveOutWidth = document.body.clientWidth;
      var keep = Math.abs(event.deltaX) < 80 || Math.abs(event.velocityX) < 0.5;

      event.target.classList.toggle("removed", !keep);

      if (!keep) {
        var endX = Math.max(
          Math.abs(event.velocityX) * moveOutWidth,
          moveOutWidth
        );
        var toX = event.deltaX > 0 ? endX : -endX;
        event.target.style.transform =
          "translate(" + toX + "px, -100px) rotate(-30deg)";
      } else {
        event.target.style.transform = "";
      }

      var questionText = event.target.getAttribute("data-question");
      var responseObj = {
        question: questionText,
        response: event.deltaX > 0 ? "Yes" : "No",
      };
      userResponses.push(responseObj);

      if (!areCardsLeft()) {
        contactForm.classList.add("active");
        love.style.display = "none";
        nope.style.display = "none";
      }

      initCards();
    });
  });
}

nope.addEventListener("click", createButtonListener(false));
love.addEventListener("click", createButtonListener(true));

function createButtonListener(love) {
  return function (event) {
    var cards = document.querySelectorAll(".tinder--card:not(.removed)");
    var moveOutWidth = document.body.clientWidth * 1.5;

    if (cards.length === 0) return;

    var card = cards[0];
    card.classList.add("removed");

    var questionText = card.getAttribute("data-question");
    var responseObj = {
      question: questionText,
      response: love ? "Yes" : "No",
    };
    userResponses.push(responseObj);

    if (love) {
      card.style.transform =
        "translate(" + moveOutWidth + "px, -100px) rotate(-30deg)";
      tinderContainer.classList.add("tinder_love");
    } else {
      card.style.transform =
        "translate(-" + moveOutWidth + "px, -100px) rotate(30deg)";
      tinderContainer.classList.add("tinder_nope");
    }

    setTimeout(function () {
      tinderContainer.classList.remove("tinder_love", "tinder_nope");
    }, 300);

    if (!areCardsLeft()) {
      contactForm.classList.add("active");
      tinderButtons.style.display = "none";
      if (love) {
        love.style.display = "none";
      }
      if (nope) {
        nope.style.display = "none";
      }
    }

    initCards();
    event.preventDefault();
  };
}

async function createResponseEntry(userResponses, name) {
  try {
    var client1 = createClient({
      accessToken: "CFPAT-zRR4BXhLNQDUuSJjiorbjOq2AtHODNJy4ZeKIf09vd0",
    });

    client1
      .getSpace("ke0oshiiblfc")
      .then((space) => space.getEnvironment("master"))
      .then((environment) =>
        environment.createEntry("userResponses", {
          fields: {
            name: {
              "en-US": name,
            },
            response: {
              "en-US": userResponses,
            },
          },
        })
      )
      .then((entry) => {
        contactForm.style.display = "none";
        tinderContainer.style.display = "none";
        thanksModalWrapper.style.display = "flex";
      })
      .catch(console.error);
  } catch (error) {
    console.error(error);
  }
}

function areCardsLeft() {
  const remainingCards = document.querySelectorAll(
    ".tinder--card:not(.removed)"
  );
  return remainingCards.length > 0;
}

contactForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const email = document.getElementById("email").value;

  var userResponse = {
    name: name,
    phone: phone,
    email: email,
    responses: userResponses,
  };

  createResponseEntry(userResponse, name);

  try {
    const response = await fetch(
      "https://questionaire-peach.vercel.app/api/email",
      {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: name,
          phoneNumber: phone,
          email: email,
          answers: userResponses,
          smtpHost: "smtp-mail.outlook.com",
          smtpPort: "587",
          smtpUser: "matchtool15@outlook.com",
          smtpPass: "Matchtool123@",
          smtpFrom: "matchtool15@outlook.com",
          smtpTo: "info@matchtool.nl",
        }),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to submit form");
    } else {
      contactForm.style.display = "none";
      tinderContainer.style.display = "none";
      thanksModalWrapper.style.display = "flex";
    }
  } catch (error) {
    console.error("Error submitting form:", error.message);
  }
});
