🛹 NY Sewer Skater (Flappy Skate)
A fast-paced, 2D side-scrolling arcade game built with p5.js. Navigate a skater through toxic New York sewer pipelines, dodge radioactive obstacles, and push for a high score in a dark, industrial neon aesthetic.

🌟 Features
Radioactive Industrial Aesthetic: Immersive dark underground background featuring high-contrast neon green glows (drawingContext.shadowBlur), toxic water hazards, and cel-shaded visuals.

Smart Obstacle Generation:

Upper pipes spawn with randomized variations.

Lower pipes follow a strict, non-random sequence (derechaAbajo ➔ derechaAbajo ➔ abiertaAbajo) to maintain balanced gameplay progression.

Dynamic Physics & Fair Collisions: Custom spring-like physics for pipe movements and fine-tuned collision bounding boxes with padding to ensure fair, frustration-free hits.

Audio Integration: Continuous background music loop powered by p5.sound.js with automated browser audio context unlocking.

Game State Management: Seamless transitions between Start Screen, Cinematic Intro, Active Gameplay, and Game Over states.

🛠️ Tech Stack
JavaScript (ES6+)

p5.js (Core graphics and rendering)

p5.sound.js (Audio management)

HTML5 Canvas & CSS3

🎮 Controls
SPACEBAR: Jump / Start game / Restart after Game Over.

Mouse Clicks: Interact with menu elements and initialize audio.

🚀 How to Run Locally
Because modern web browsers enforce strict CORS security policies on local files (file://), running this game requires a local development server.

Clone or Download this repository to your local machine.

Open the project folder in your code editor (such as VS Code).

Run the project using a local server extension:

If using VS Code, install the Live Server extension.

Right-click on index.html and select "Open with Live Server".

Enjoy the game!
