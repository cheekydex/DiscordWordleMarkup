const form = document.querySelector("#wordle-form");
const answerInput = document.querySelector("#answer");
const guessInput = document.querySelector("#guess");
const errorMessage = document.querySelector("#error-message");
const result = document.querySelector("#result");
const resultOutput = document.querySelector("#result-output");
const cluePreview = document.querySelector("#clue-preview");
const copyButton = document.querySelector("#copy-button");
const copyLabel = document.querySelector("#copy-label");

const EMOJI_NAMES = {
  green: ":green_square:",
  orange: ":orange_square:",
  red: ":red_square:",
};

const EMOJI_CHARACTERS = {
  green: "🟩",
  orange: "🟧",
  red: "🟥",
};

/**
 * Scores a five-letter guess using Wordle's duplicate-letter rules.
 * Exact matches are claimed first; misplaced matches then consume only the
 * remaining instances of each answer letter.
 */
function scoreGuess(answer, guess) {
  const answerLetters = answer.toUpperCase().split("");
  const guessLetters = guess.toUpperCase().split("");
  const scores = Array(5).fill("red");
  const remaining = new Map();

  for (let index = 0; index < 5; index += 1) {
    if (guessLetters[index] === answerLetters[index]) {
      scores[index] = "green";
    } else {
      const letter = answerLetters[index];
      remaining.set(letter, (remaining.get(letter) || 0) + 1);
    }
  }

  for (let index = 0; index < 5; index += 1) {
    if (scores[index] === "green") continue;

    const letter = guessLetters[index];
    const available = remaining.get(letter) || 0;
    if (available > 0) {
      scores[index] = "orange";
      remaining.set(letter, available - 1);
    }
  }

  return { guessLetters, scores };
}

function createClue(answer, guess) {
  const { guessLetters, scores } = scoreGuess(answer, guess);
  return guessLetters.map((letter, index) => `${EMOJI_NAMES[scores[index]]}${letter}`).join("  ");
}

function renderPreview(answer, guess) {
  const { guessLetters, scores } = scoreGuess(answer, guess);
  cluePreview.replaceChildren();

  guessLetters.forEach((letter, index) => {
    const tile = document.createElement("span");
    tile.className = "preview-tile";
    tile.textContent = `${EMOJI_CHARACTERS[scores[index]]}${letter}`;
    cluePreview.appendChild(tile);
  });
}

function cleanInput(input) {
  input.value = input.value.replace(/[^a-z]/gi, "").slice(0, 5).toUpperCase();
  const count = document.querySelector(`#${input.id}-count`);
  count.textContent = `${input.value.length} / 5`;
  input.removeAttribute("aria-invalid");
  errorMessage.textContent = "";
}

function validateWord(input) {
  const isValid = /^[A-Z]{5}$/.test(input.value);
  input.setAttribute("aria-invalid", String(!isValid));
  return isValid;
}

async function copyResult() {
  const text = resultOutput.textContent;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      const copied = document.execCommand("copy");
      textArea.remove();
      if (!copied) throw new Error("Copy command was unavailable");
    }

    copyLabel.textContent = "Copied!";
    window.setTimeout(() => {
      copyLabel.textContent = "Copy text";
    }, 1800);
  } catch {
    copyLabel.textContent = "Select & copy";
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(resultOutput);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

[answerInput, guessInput].forEach((input) => {
  input.addEventListener("input", () => cleanInput(input));
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const answerIsValid = validateWord(answerInput);
  const guessIsValid = validateWord(guessInput);

  if (!answerIsValid || !guessIsValid) {
    errorMessage.textContent = "Answer and Guess must each contain exactly 5 letters.";
    (answerIsValid ? guessInput : answerInput).focus();
    result.hidden = true;
    return;
  }

  errorMessage.textContent = "";
  resultOutput.textContent = createClue(answerInput.value, guessInput.value);
  renderPreview(answerInput.value, guessInput.value);
  result.hidden = false;
  copyLabel.textContent = "Copy text";
});

copyButton.addEventListener("click", copyResult);
