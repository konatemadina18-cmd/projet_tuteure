// FICHIER : scripts/contact.js
// Gestion du formulaire de contact

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
});

// Gérer l'envoi du formulaire de contact
async function handleContactSubmit(event) {
    event.preventDefault();
    
    const formData = {
        nom: document.getElementById('nom').value,
        email: document.getElementById('email').value,
        telephone: document.getElementById('telephone').value,
        sujet: document.getElementById('sujet').value,
        message: document.getElementById('message').value
    };
    
    // Validation basique
    if (!formData.nom || !formData.email || !formData.sujet || !formData.message) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
    }
    
    // Pour l'instant, on affiche juste un message de succès
    // Plus tard, on pourra envoyer à une API
    console.log('Message de contact:', formData);
    
    alert('Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.');
    
    // Réinitialiser le formulaire
    document.getElementById('contactForm').reset();
}

