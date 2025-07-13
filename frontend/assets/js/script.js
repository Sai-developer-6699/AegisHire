
document.addEventListener('DOMContentLoaded', function () {

// Mobile menu toggle
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');
mobileMenuButton.addEventListener('click', () => {
  mobileMenu.classList.toggle('hidden');
});

// Animated circles background using Anime.js
document.addEventListener('DOMContentLoaded', () => {
  const bg = document.getElementById('animated-bg');
  const circlesCount = 8;
  const colors = ["#10B981", "#047857", "#065F46", "#6EE7B7"];

  for (let i = 0; i < circlesCount; i++) {
    const circle = document.createElement('div');
    circle.classList.add('circle');
    circle.style.background = colors[i % colors.length];
    const size = anime.random(150, 400);
    circle.style.width = size + 'px';
    circle.style.height = size + 'px';
    circle.style.top = anime.random(0, window.innerHeight) + 'px';
    circle.style.left = anime.random(0, window.innerWidth) + 'px';
    bg.appendChild(circle);
  }

  anime({
    targets: '.circle',
    translateX: () => anime.random(-300, 300),
    translateY: () => anime.random(-300, 300),
    scale: [{ value: 1, duration: 2000 }, { value: 1.3, duration: 2000 }],
    opacity: [{ value: 0.15, duration: 1000 }, { value: 0.25, duration: 3000 }],
    easing: 'easeInOutSine',
    duration: 5000,
    direction: 'alternate',
    loop: true,
    delay: anime.stagger(300)
  });

  window.addEventListener('resize', () => {
    document.querySelectorAll('.circle').forEach(circle => {
      circle.style.top = anime.random(0, window.innerHeight) + 'px';
      circle.style.left = anime.random(0, window.innerWidth) + 'px';
    });
  });
});
// Smooth scroll for anchor links
const anchorLinks = document.querySelectorAll('a[href^="#"]');
anchorLinks.forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
}
);


});