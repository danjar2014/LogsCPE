document.addEventListener('DOMContentLoaded', () => {
    // URL du serveur distant (remplacez par l'URL de votre serveur IIS)
    const serverUrl = 'http://localhost'; // Exemple : 'http://192.168.1.100'

    // Gestion des sections
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
    const sections = document.querySelectorAll('.section-content');

    // Fonction pour activer une section
    function activateSection(sectionId) {
        sections.forEach(section => section.classList.remove('active'));
        const activeSection = document.getElementById(sectionId);
        if (activeSection) {
            activeSection.classList.add('active');
        }
    }

    // Gestion des clics sur la bannière verticale
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            activateSection(sectionId);

            // Mettre à jour l'URL sans recharger la page
            history.pushState(null, '', `#${sectionId}`);

            // Mettre à jour la bannière verticale
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Charger la section active au chargement de la page
    const hash = window.location.hash.substring(1);
    if (hash) {
        const sectionId = hash === 'home' ? 'home' : hash === 'provisioning' ? 'bulk' : hash === 'documentation' ? 'documentation' : 'home';
        activateSection(sectionId);

        // Mettre à jour la bannière verticale
        sidebarLinks.forEach(link => link.classList.remove('active'));
        const sidebarLink = Array.from(sidebarLinks).find(link => link.getAttribute('data-section') === sectionId);
        if (sidebarLink) {
            sidebarLink.classList.add('active');
        }
    }

    // --- Bulk Import ---
    const bulkForm = document.getElementById('bulkUploadForm');
    const bulkFileUploadInput = document.getElementById('bulkFileUpload');
    const bulkUploadButton = document.getElementById('bulkUploadButton');
    const bulkUploadButtonContainer = document.getElementById('bulkUploadButtonContainer');
    const bulkFileUploadError = document.getElementById('bulkFileUploadError');
    const bulkUploadStatus = document.getElementById('bulkUploadStatus');
    const bulkUploadProgress = document.getElementById('bulkUploadProgress');

    // Vérifier l'existence du fichier importCIS.csv au chargement de la page
    let bulkFileExists = false;
    fetch(`${serverUrl}/upload.aspx?action=check-file`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text(); // Récupérer la réponse sous forme de texte brut
        })
        .then(text => {
            // Vérifier si la réponse est un JSON valide
            if (!text.trim().startsWith('{')) {
                throw new Error('Response is not valid JSON: ' + text);
            }
            return JSON.parse(text); // Parser la réponse en JSON
        })
        .then(data => {
            bulkFileExists = data.exists;
            if (bulkFileExists) {
                bulkUploadButtonContainer.innerHTML = '<p class="error-message">Provisioning in progress refresh after 5mins</p>'; // Message modifié
            } else {
                validateBulkForm(); // Appeler la validation initiale si le fichier n'existe pas
            }
        })
        .catch(error => {
            bulkUploadStatus.textContent = 'Error checking file existence: ' + error.message;
        });

    // Fonction pour valider le formulaire Bulk Import
    function validateBulkForm() {
        let isValid = true;

        // Valider le fichier (doit être nommé importCIS.csv)
        const file = bulkFileUploadInput.files[0];
        if (!file) {
            bulkFileUploadError.textContent = 'Please select a file';
            isValid = false;
        } else if (file.name !== 'importCIS.csv') {
            bulkFileUploadError.textContent = 'File must be named "importCIS.csv"';
            isValid = false;
        } else {
            bulkFileUploadError.textContent = '';
        }

        // Activer ou désactiver le bouton Upload (seulement si le fichier n'existe pas)
        if (!bulkFileExists) {
            bulkUploadButton.disabled = !isValid;
        }
        return isValid;
    }

    // Écouter les changements dans le champ pour valider en temps réel
    bulkFileUploadInput.addEventListener('change', validateBulkForm);

    // Gérer la soumission du formulaire Bulk Import
    bulkForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!validateBulkForm()) {
            return;
        }

        // Afficher le message "Uploading in progress"
        bulkUploadButtonContainer.style.display = 'none';
        bulkUploadProgress.style.display = 'block';

        // Créer un FormData pour envoyer les données au serveur
        const formData = new FormData();
        formData.append('fileUpload', bulkFileUploadInput.files[0]);

        // Envoyer les données à upload.aspx sur le serveur distant
        fetch(`${serverUrl}/upload.aspx`, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            if (!text.trim().startsWith('{')) {
                throw new Error('Response is not valid JSON: ' + text);
            }
            return JSON.parse(text);
        })
        .then(data => {
            // Cacher le message "Uploading in progress"
            bulkUploadProgress.style.display = 'none';

            if (data.success) {
                bulkFileExists = true;
                bulkUploadStatus.textContent = 'Uploading in progress'; // Message modifié
                bulkUploadButtonContainer.innerHTML = '<p class="error-message">Provisioning in progress refresh after 5mins</p>'; // Message modifié
                bulkForm.reset();
            } else {
                bulkUploadStatus.textContent = 'Error: ' + data.message;
                bulkUploadButtonContainer.style.display = 'block';
            }
        })
        .catch(error => {
            bulkUploadProgress.style.display = 'none';
            bulkUploadStatus.textContent = 'Error uploading file: ' + error.message;
            bulkUploadButtonContainer.style.display = 'block';
        });
    });
});