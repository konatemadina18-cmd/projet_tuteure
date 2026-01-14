// ========== GESTIONNAIRE DE MESSAGERIE ==========
// Gère les conversations, messages texte, images et audio

let currentConversationId = null;
let currentRecipientId = null;
let mediaRecorder = null;
let audioChunks = [];
let recordingTimer = null;
let recordingStartTime = null;
let selectedImageFile = null;
let recordedAudioBlob = null;

// ========== CHARGEMENT DES CONVERSATIONS ==========
async function loadConversations() {
    const conversationsList = document.getElementById('conversationsList');
    if (!conversationsList) return;
    
    try {
        const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
        if (!userData) return;
        
        conversationsList.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">Chargement des messages...</p>';
        
        // Récupérer les messages reçus
        const response = await AgriConnectAPI.getReceivedMessages(userData.id);
        
        if (response.status === 'success' && response.messages && response.messages.length > 0) {
            // Grouper les messages par expéditeur
            const groupedBySender = {};
            
            response.messages.forEach(msg => {
                if (!groupedBySender[msg.sender_id]) {
                    groupedBySender[msg.sender_id] = {
                        sender_id: msg.sender_id,
                        sender_name: msg.sender_name,
                        messages: [],
                        unread_count: 0,
                        last_message_time: null
                    };
                }
                groupedBySender[msg.sender_id].messages.push(msg);
                if (!msg.is_read) {
                    groupedBySender[msg.sender_id].unread_count++;
                }
                groupedBySender[msg.sender_id].last_message_time = msg.created_at;
            });
            
            // Créer la liste des conversations
            conversationsList.innerHTML = Object.values(groupedBySender).map((conv, index) => {
                const lastMsg = conv.messages[0];
                const preview = lastMsg.message.substring(0, 50) + (lastMsg.message.length > 50 ? '...' : '');
                return `
                    <div class="conversation-item" onclick="openConversationFromMessage('${conv.sender_id}', '${conv.sender_name}')">
                        <div class="conversation-avatar" style="background: #4a7c3a; color: white; display: flex; align-items: center; justify-content: center; width: 50px; height: 50px; border-radius: 50%; font-weight: bold;">
                            ${conv.sender_name.charAt(0).toUpperCase()}
                        </div>
                        <div class="conversation-info" style="flex: 1; margin-left: 12px;">
                            <p class="conversation-name" style="font-weight: 600; margin: 5px 0; color: #2c3e50;">${conv.sender_name}</p>
                            <p class="conversation-preview" style="font-size: 0.9rem; color: #7f8c8d; margin: 3px 0;">${preview}</p>
                        </div>
                        <div class="conversation-meta" style="text-align: right;">
                            ${conv.unread_count > 0 ? `<span class="conversation-badge" style="display: inline-block; background: #ff9800; color: white; border-radius: 50%; width: 24px; height: 24px; line-height: 24px; text-align: center; font-size: 0.85rem; margin-bottom: 5px;">${conv.unread_count}</span>` : ''}
                            <span class="conversation-time" style="display: block; font-size: 0.85rem; color: #9ca3af;">${formatTime(conv.last_message_time)}</span>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            conversationsList.innerHTML = `
                <div style="text-align: center; color: #7f8c8d; padding: 40px;">
                    <div style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;">💬</div>
                    <p style="margin: 10px 0; font-weight: 500;">Aucun message pour le moment</p>
                    <p style="font-size: 0.9rem; color: #9ca3af; margin-top: 5px;">
                        Vous recevrez les messages de l'administration et des autres utilisateurs ici
                    </p>
                </div>
            `;
        }        
        // Après avoir chargé les conversations, vérifier s'il y a une nouvelle conversation en attente
        checkForNewConversation();    } catch (error) {
        console.error('Erreur chargement conversations:', error);
        conversationsList.innerHTML = `
            <p style="text-align: center; color: #e74c3c; padding: 20px;">
                Erreur de chargement: ${error.message}
            </p>
        `;
    }
}

// ========== VÉRIFIER SI NOUVELLE CONVERSATION EN ATTENTE ==========
function checkForNewConversation() {
    const newConversationData = localStorage.getItem('agriConnect_new_conversation');
    if (!newConversationData) return;
    
    try {
        const convData = JSON.parse(newConversationData);
        console.log('Nouvelle conversation détectée:', convData);
        
        // Ouvrir la conversation avec le producteur
        setTimeout(() => {
            openConversation(
                null, 
                convData.producteur_id, 
                convData.producteur_nom || 'Producteur',
                'PRODUCTEUR'
            );
            
            // Afficher le nom du produit dans un message d'information
            const chatUserRole = document.getElementById('chatUserRole');
            if (chatUserRole && convData.produit_nom) {
                chatUserRole.textContent = `Producteur - Au sujet de: ${convData.produit_nom}`;
            }
            
            // Supprimer les données de conversation du localStorage
            localStorage.removeItem('agriConnect_new_conversation');
        }, 500);
    } catch (error) {
        console.error('Erreur traitement nouvelle conversation:', error);
        localStorage.removeItem('agriConnect_new_conversation');
    }
}

// Fonction pour ouvrir une conversation à partir des messages
function openConversationFromMessage(senderId, senderName) {
    openConversation(null, senderId, senderName, 'ADMIN');
}

// ========== OUVRIR UNE CONVERSATION ==========
async function openConversation(conversationId, recipientId, recipientName, recipientRole, eventElement) {
    console.log('openConversation appelée avec:', { conversationId, recipientId, recipientName });
    
    currentConversationId = conversationId;
    currentRecipientId = recipientId;
    
    // Mettre à jour l'en-tête
    const chatUserName = document.getElementById('chatUserName');
    const chatUserRole = document.getElementById('chatUserRole');
    if (chatUserName) chatUserName.textContent = recipientName;
    if (chatUserRole) chatUserRole.textContent = recipientRole;
    
    // Activer la conversation dans la liste
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    if (eventElement) {
        const item = typeof eventElement === 'string' 
            ? document.querySelector(eventElement)
            : eventElement.closest('.conversation-item');
        if (item) item.classList.add('active');
    }
    
    // Afficher la zone de saisie
    const inputContainer = document.getElementById('messageInputContainer');
    console.log('inputContainer trouvé:', inputContainer);
    if (inputContainer) {
        console.log('Avant display:', inputContainer.style.display);
        inputContainer.style.display = 'block';
        inputContainer.style.visibility = 'visible';
        inputContainer.style.opacity = '1';
        console.log('Après display:', inputContainer.style.display);
    }
    
    // Charger les messages
    await loadConversationMessages(conversationId);
}

// ========== CHARGER LES MESSAGES D'UNE CONVERSATION ==========
async function loadConversationMessages(conversationId) {
    const messagesArea = document.getElementById('messagesArea');
    if (!messagesArea) return;
    
    try {
        const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
        if (!userData) return;
        
        messagesArea.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">Chargement des messages...</p>';
        
        // Récupérer les messages de la conversation
        const response = await AgriConnectAPI.getConversationMessages(userData.id, currentRecipientId);
        
        if (response.status === 'success') {
            if (response.messages && response.messages.length > 0) {
                // Afficher les messages
                messagesArea.innerHTML = response.messages.map(msg => renderMessage(msg, userData.id)).join('');
                scrollToBottom(messagesArea);
            } else {
                messagesArea.innerHTML = `
                    <div class="messages-empty" style="text-align: center; padding: 40px; color: #7f8c8d;">
                        <div style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;">💬</div>
                        <p style="margin: 10px 0; font-weight: 500;">Aucun message dans cette conversation</p>
                        <p style="font-size: 0.9rem; color: #9ca3af;">
                            Commencez la conversation en envoyant un message
                        </p>
                    </div>
                `;
            }
        } else {
            throw new Error(response.message || 'Erreur de chargement');
        }
    } catch (error) {
        console.error('Erreur chargement messages:', error);
        messagesArea.innerHTML = `
            <p style="text-align: center; color: #e74c3c; padding: 20px;">
                Erreur de chargement des messages: ${error.message}
            </p>
        `;
    }
}

// ========== RENDU D'UN MESSAGE ==========
function renderMessage(message, currentUserId) {
    const isSent = message.sender_id == currentUserId;
    const messageClass = isSent ? 'sent' : 'received';
    const bgColor = isSent ? '#4a7c3a' : '#f0f0f0';
    const textColor = isSent ? 'white' : '#2c3e50';
    
    const messageTime = new Date(message.created_at);
    const timeStr = messageTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    return `
        <div style="display: flex; justify-content: ${isSent ? 'flex-end' : 'flex-start'}; margin: 10px 0; padding: 0 15px;">
            <div style="background: ${bgColor}; color: ${textColor}; padding: 12px 15px; border-radius: 12px; max-width: 70%; word-wrap: break-word;">
                <p style="margin: 0 0 5px 0; line-height: 1.5;">${escapeHtml(message.message)}</p>
                <p style="margin: 0; font-size: 0.85rem; opacity: 0.7;">${timeStr}</p>
            </div>
        </div>
    `;
}

// ========== ENVOYER UN MESSAGE ==========
async function sendMessage() {
    const messageText = document.getElementById('messageText');
    const text = messageText?.value.trim() || '';
    
    if (!text) {
        alert('Veuillez écrire un message');
        return;
    }
    
    if (!currentRecipientId) {
        alert('Veuillez sélectionner une conversation');
        return;
    }
    
    try {
        const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
        if (!userData) {
            alert('Vous devez être connecté');
            return;
        }
        
        // Désactiver le bouton d'envoi
        const sendBtn = document.querySelector('button[onclick="sendMessage()"]');
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.textContent = '⏳ Envoi...';
        }
        
        // Préparer les données du message
        const messageData = {
            sender_id: userData.id,
            sender_name: `${userData.prenom} ${userData.nom}`,
            recipient_id: currentRecipientId,
            sujet: 'Message de conversation',
            message: text,
            product_id: null
        };
        
        // Envoyer le message avec l'API générique
        const response = await AgriConnectAPI.sendMessage(messageData);
        
        if (response.status === 'success') {
            // Réinitialiser le champ de texte
            if (messageText) {
                messageText.value = '';
                autoResizeTextarea(messageText);
            }
            
            // Recharger les messages
            await loadConversationMessages(currentConversationId);
            
            // Recharger les conversations
            await loadConversations();
            
            // Réactiver le bouton
            if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.textContent = '📨 Envoyer';
            }
        } else {
            throw new Error(response.message || 'Erreur lors de l\'envoi');
        }
        
    } catch (error) {
        console.error('Erreur envoi message:', error);
        alert('❌ Erreur lors de l\'envoi: ' + error.message);
        
        // Réactiver le bouton
        const sendBtn = document.querySelector('button[onclick="sendMessage()"]');
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.textContent = '📨 Envoyer';
        }
    }
}

// ========== GESTION DES IMAGES ==========
function triggerImageInput() {
    document.getElementById('imageInput').click();
}

function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB max
        alert('L\'image est trop grande (max 5MB)');
        return;
    }
    
    selectedImageFile = file;
    
    // Afficher l'aperçu
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('imagePreview');
        const container = document.getElementById('imagePreviewContainer');
        if (preview && container) {
            preview.src = e.target.result;
            container.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}

function removeImagePreview() {
    selectedImageFile = null;
    const container = document.getElementById('imagePreviewContainer');
    const input = document.getElementById('imageInput');
    if (container) container.style.display = 'none';
    if (input) input.value = '';
}

// ========== GESTION DE L'ENREGISTREMENT VOCAL ==========
async function toggleVoiceRecording() {
    const btn = document.getElementById('voiceRecordBtn');
    const indicator = document.getElementById('recordingIndicator');
    
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopRecording();
    } else {
        startRecording();
    }
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            recordedAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            audioChunks = [];
            
            // Arrêter le stream
            stream.getTracks().forEach(track => track.stop());
            
            // Afficher l'aperçu audio
            const audioPreview = document.getElementById('audioPreview');
            const container = document.getElementById('audioPreviewContainer');
            if (audioPreview && container) {
                audioPreview.src = URL.createObjectURL(recordedAudioBlob);
                container.style.display = 'block';
            }
        };
        
        mediaRecorder.start();
        recordingStartTime = Date.now();
        
        // Afficher l'indicateur d'enregistrement
        document.getElementById('recordingIndicator').style.display = 'flex';
        document.getElementById('voiceRecordBtn').textContent = '⏹';
        
        // Démarrer le timer
        recordingTimer = setInterval(updateRecordingTime, 1000);
        
    } catch (error) {
        console.error('Erreur accès microphone:', error);
        alert('Impossible d\'accéder au microphone. Vérifiez les permissions.');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
    
    // Cacher l'indicateur
    document.getElementById('recordingIndicator').style.display = 'none';
    document.getElementById('voiceRecordBtn').textContent = '🎤';
    
    // Arrêter le timer
    if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
    }
    recordingStartTime = null;
}

function updateRecordingTime() {
    if (!recordingStartTime) return;
    
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    
    const timeDisplay = document.getElementById('recordingTime');
    if (timeDisplay) {
        timeDisplay.textContent = `${minutes}:${seconds}`;
    }
}

function removeAudioPreview() {
    recordedAudioBlob = null;
    const container = document.getElementById('audioPreviewContainer');
    const audioPreview = document.getElementById('audioPreview');
    if (container) container.style.display = 'none';
    if (audioPreview) {
        audioPreview.src = '';
        URL.revokeObjectURL(audioPreview.src);
    }
}

// ========== UTILITAIRES ==========
function handleMessageKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function getRoleIcon(role) {
    const icons = {
        'ACHETEUR': '🛒',
        'PRODUCTEUR': '👨‍🌾',
        'LIVREUR': '🚚',
        'ADMIN': '⚙️'
    };
    return icons[role] || '👤';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function openImageModal(imageSrc) {
    // TODO: Créer une modal pour afficher l'image en grand
    window.open(imageSrc, '_blank');
}

