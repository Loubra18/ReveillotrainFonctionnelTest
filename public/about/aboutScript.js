const mainMenuSlideInn = document.querySelector('.menuDetails');
const menuButton = document.querySelector('.menu');
let isSLideInn = false;
const bannerTextButton = document.querySelector('.banner-text');

main()

async function main() {
    menuButton.addEventListener('click', displayMenuFavoris);
    bannerTextButton.addEventListener('click',() => {
        window.location.href = '/body.html';
    });
}

// affiche le menu des favoris

function displayMenuFavoris() {
    console.log('click');
    if(isSLideInn){
        mainMenuSlideInn.classList.remove('display');
        isSLideInn = false;
        return;
    }
    mainMenuSlideInn.classList.add('display');
    isSLideInn = true;
}

document.querySelectorAll('.accordion button').forEach(button => {
    button.addEventListener('click', () => {
        const expanded = button.getAttribute('aria-expanded') === 'true' || false;

        // Toggle l'attribut aria-expanded
        button.setAttribute('aria-expanded', !expanded);

        // Toggle la classe .accordion-content
        button.nextElementSibling.style.maxHeight = !expanded ? button.nextElementSibling.scrollHeight + 'px' : '0';
    });
});