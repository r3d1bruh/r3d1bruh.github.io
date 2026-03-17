// Effects list
const effects = [];

// 1. Scrolling marquee
effects.push(function scrollTitle(next) {
  let msg = "✨ Welcome to My Site ✨ ";
  let pos = 0;
  let interval = setInterval(() => {
    document.title = msg.substring(pos) + msg.substring(0, pos);
    pos = (pos + 1) % msg.length;
  }, 200);
  setTimeout(() => {
    clearInterval(interval);
    next();
  }, 5000); // run 5s then move on
});

// 2. Blinking
effects.push(function blinkTitle(next) {
  let visible = true;
  let interval = setInterval(() => {
    document.title = visible ? "🚀 My Cool Site" : " ";
    visible = !visible;
  }, 500);
  setTimeout(() => {
    clearInterval(interval);
    next();
  }, 5000);
});

// 3. Typing effect
effects.push(function typeTitle(next) {
  const text = "Typewriter Effect!";
  let i = 0;
  let interval = setInterval(() => {
    document.title = text.substring(0, i + 1);
    i++;
    if (i === text.length) {
      clearInterval(interval);
      setTimeout(next, 2000);
    }
  }, 150);
});

// 4. Rotating words
effects.push(function rotateTitle(next) {
  const words = ["Home", "About", "Contact", "Blog"];
  let i = 0;
  let interval = setInterval(() => {
    document.title = words[i];
    i = (i + 1) % words.length;
  }, 1000);
  setTimeout(() => {
    clearInterval(interval);
    next();
  }, 5000);
});

// 5. Emoji loop
effects.push(function emojiTitle(next) {
  const emojis = ["🔥", "⚡", "🌈", "🎶", "💻"];
  let i = 0;
  let interval = setInterval(() => {
    document.title = "My Site " + emojis[i];
    i = (i + 1) % emojis.length;
  }, 700);
  setTimeout(() => {
    clearInterval(interval);
    next();
  }, 5000);
});

// Run all effects in sequence
function runEffects(index = 0) {
  if (index < effects.length) {
    effects[index](() => runEffects(index + 1));
  } else {
    // Loop back to start
    runEffects(0);
  }
}

runEffects();