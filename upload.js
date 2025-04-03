document.addEventListener('DOMContentLoaded', () => {
    // URL du serveur distant (remplacez par l'URL de votre serveur IIS)
    const serverUrl = 'http://<votre-serveur>'; // Exemple : 'http://192.168.1.100'

    // Gestion des onglets
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Désactiver tous les onglets
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Activer l'onglet cliqué
            button.classList.add('active');
            const tabId = button.getElementById('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

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
        .then(response => response.json())
        .then(data => {
            bulkFileExists = data.exists;
            if (bulkFileExists) {
                bulkUploadButtonContainer.innerHTML = '<p class="error-message">Error: importCIS.csv already exists in C:\\temp. Please delete it before uploading a new file.</p>';
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
        .then(response => response.json())
        .then(data => {
            // Cacher le message "Uploading in progress"
            bulkUploadProgress.style.display = 'none';

            if (data.success) {
                bulkFileExists = true;
                bulkUploadStatus.textContent = data.message;
                bulkUploadButtonContainer.innerHTML = '<p class="error-message">Error: importCIS.csv already exists in C:\\temp. Please delete it before uploading a new file.</p>';
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

    // --- Simple Import ---
    const simpleForm = document.getElementById('simpleUploadForm');
    const simpleMachineNameInput = document.getElementById('simpleMachineName');
    const simpleMacAddressInput = document.getElementById('simpleMacAddress');
    const simpleUploadButton = document.getElementById('simpleUploadButton');
    const simpleUploadButtonContainer = document.getElementById('simpleUploadButtonContainer');
    const simpleMachineNameError = document.getElementById('simpleMachineNameError');
    const simpleMacAddressError = document.getElementById('simpleMacAddressError');
    const simpleUploadStatus = document.getElementById('simpleUploadStatus');
    const simpleUploadProgress = document.getElementById('simpleUploadProgress');

    // Vérifier l'existence du fichier simple-import.csv au chargement de la page
    let simpleFileExists = false;
    fetch(`${serverUrl}/simple-upload.aspx?action=check-file`)
        .then(response => response.json())
        .then(data => {
            simpleFileExists = data.exists;
            validateSimpleForm(); // Appeler la validation initiale
        })
        .catch(error => {
            simpleUploadStatus.textContent = 'Error checking file existence: ' + error.message;
        });

    // Fonction pour valider le formulaire Simple Import
    function validateSimpleForm() {
        let isValid = true;

        // Valider Machine Name (doit commencer par PARM)
        const machineName = simpleMachineNameInput.value.trim();
        if (!machineName.startsWith('PARM')) {
            simpleMachineNameError.textContent = 'Machine Name must start with "PARM" (e.g., PARM00316133)';
            isValid = false;
        } else {
            simpleMachineNameError.textContent = '';
        }

        // Valider MAC Address (format XX:XX:XX:XX:XX:XX)
        const macAddress = simpleMacAddressInput.value.trim();
        const macAddressRegex = /^([0-9A-Fa-f]{2}:){5}([0-9A-Fa-f]{2})$/;
        if (!macAddressRegex.test(macAddress)) {
            simpleMacAddressError.textContent = 'MAC Address must be in the format 00:FF:CF:04:AC:C3';
            isValid = false;
        } else {
            simpleMacAddressError.textContent = '';
        }

        // Activer ou désactiver le bouton Upload
        simpleUploadButton.disabled = !isValid;
        return isValid;
    }

    // Écouter les changements dans les champs pour valider en temps réel
    simpleMachineNameInput.addEventListener('input', validateSimpleForm);
    simpleMacAddressInput.addEventListener('input', validateSimpleForm);

    // Gérer la soumission du formulaire Simple Import
    simpleForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!validateSimpleForm()) {
            return;
        }

        // Afficher le message "Uploading in progress"
        simpleUploadButtonContainer.style.display = 'none';
        simpleUploadProgress.style.display = 'block';

        // Créer un FormData pour envoyer les données au serveur
        const formData = new FormData();
        formData.append('machineName', simpleMachineNameInput.value.trim());
        formData.append('macAddress', simpleMacAddressInput.value.trim());

        // Envoyer les données à simple-upload.aspx sur le serveur distant
        fetch(`${serverUrl}/simple-upload.aspx`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Cacher le message "Uploading in progress"
            simpleUploadProgress.style.display = 'none';

            if (data.success) {
                simpleUploadStatus.textContent = data.message;
                simpleUploadButtonContainer.style.display = 'block';
                simpleForm.reset();
            } else {
                simpleUploadStatus.textContent = 'Error: ' + data.message;
                simpleUploadButtonContainer.style.display = 'block';
            }
        })
        .catch(error => {
            simpleUploadProgress.style.display = 'none';
            simpleUploadStatus.textContent = 'Error adding entry: ' + error.message;
            simpleUploadButtonContainer.style.display = 'block';
        });
    });
});