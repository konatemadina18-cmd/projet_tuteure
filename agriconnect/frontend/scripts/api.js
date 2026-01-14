// FICHIER : scripts/api.js
// BUT : Communiquer avec l'API backend AgriConnect

// URL de base de l'API - Version simple et directe
const API_BASE = 'http://localhost/agriconnect2/agriconnect/api';

class AgriConnectAPI {
    
    static async request(endpoint, options = {}) {
        const url = `${API_BASE}/${endpoint}`;
        
        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };
        
        if (options.body) {
            config.body = JSON.stringify(options.body);
        }
        
        try {
            const response = await fetch(url, config);
            
            // Lire le texte d'abord pour vérifier
            const text = await response.text();
            
            // Essayer de parser en JSON
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                // Si ce n'est pas du JSON, retourner une erreur
                throw new Error('Réponse invalide du serveur: ' + text.substring(0, 200));
            }
            
            return data;
        } catch (error) {
            console.error('Erreur API:', error);
            throw error;
        }
    }
    
    // AUTHENTIFICATION
    
    static async register(userData) {
        return this.request('auth/register.php', {
            method: 'POST',
            body: userData
        });
    }
    
    static async login(loginData) {
        return this.request('auth/login.php', {
            method: 'POST',
            body: loginData
        });
    }
    
    //  PRODUITS 
    
    static async getProducts(filters = {}) {
        let endpoint = 'products/get_products_simple.php';
        
        const params = new URLSearchParams();
        if (filters.commune) params.append('commune', filters.commune);
        if (filters.categorie) params.append('categorie', filters.categorie);
        if (filters.search) params.append('search', filters.search);
        
        if (params.toString()) {
            endpoint += '?' + params.toString();
        }
        
        return this.request(endpoint);
    }
    
    static async createProduct(productData) {
        return this.request('products/create_product.php', {
            method: 'POST',
            body: productData
        });
    }
    
    static async updateProduct(productId, updates) {
        return this.request('products/update_product.php', {
            method: 'PUT',
            body: { id: productId, ...updates }
        });
    }
    
    static async deleteProduct(productId) {
        return this.request('products/delete_product.php', {
            method: 'DELETE',
            body: { id: productId }
        });
    }
    
    static async getProductDetail(productId) {
        return this.request(`products/get_product_detail.php?id=${productId}`);
    }
    
    // COMMANDES 
    
    static async createOrder(orderData) {
        return this.request('orders/create_order.php', {
            method: 'POST',
            body: orderData
        });
    }
    
    static async getOrders(userId = null, userRole = null, statut = null) {
        let endpoint = 'orders/get_orders.php';
        
        const params = new URLSearchParams();
        if (userId) params.append('user_id', userId);
        if (userRole) params.append('user_role', userRole);
        if (statut) params.append('statut', statut);
        
        if (params.toString()) {
            endpoint += '?' + params.toString();
        }
        
        return this.request(endpoint);
    }
    
    static async updateOrderStatus(commandeId, nouveauStatut) {
        return this.request('orders/update_status.php', {
            method: 'PUT',
            body: { commande_id: commandeId, statut: nouveauStatut }
        });
    }
    
    //  PROFIL UTILISATEUR 
    
    static async getProfile(userId) {
        return this.request('user/profile.php', {
            method: 'POST',
            body: { user_id: userId }
        });
    }
    
    static async updateProfile(userId, updates) {
        return this.request('user/update_profile.php', {
            method: 'PUT',
            body: { user_id: userId, ...updates }
        });
    }
    
    static async updatePassword(userId, passwordData) {
        return this.request('user/update_password.php', {
            method: 'PUT',
            body: { user_id: userId, ...passwordData }
        });
    }
    
    static async getNotifications(userId) {
        return this.request(`user/get_notifications.php?user_id=${userId}`);
    }
    
    static async markNotificationRead(notificationId, userId) {
        return this.request('user/mark_notification_read.php', {
            method: 'PUT',
            body: { notification_id: notificationId, user_id: userId }
        });
    }
    
    // PAIEMENTS 
    
    static async createPayment(paymentData) {
        return this.request('payments/create_payment.php', {
            method: 'POST',
            body: paymentData
        });
    }
    
    // ADMIN 
    
    static async getAllUsers(filters = {}) {
        let endpoint = 'admin/get_all_users.php';
        const params = new URLSearchParams();
        if (filters.role) params.append('role', filters.role);
        if (filters.search) params.append('search', filters.search);
        
        if (params.toString()) {
            endpoint += '?' + params.toString();
        }
        
        return this.request(endpoint);
    }
    
    static async getAdminStats() {
        return this.request('admin/get_stats.php');
    }
    
    static async getAllProducers() {
        return this.request('admin/get_producers.php');
    }
    
    static async getAllBuyers() {
        return this.request('admin/get_buyers.php');
    }
    
    static async getAllLivreurs() {
        return this.request('admin/get_livreurs.php');
    }
    
    static async getAllNotifications(filters = {}) {
        let endpoint = 'admin/get_all_notifications.php';
        const params = new URLSearchParams();
        if (filters.type) params.append('type', filters.type);
        
        if (params.toString()) {
            endpoint += '?' + params.toString();
        }
        
        return this.request(endpoint);
    }
    
    static async getMessages(filters = {}) {
        let endpoint = 'admin/get_messages.php';
        const params = new URLSearchParams();
        if (filters.type) params.append('type', filters.type);
        
        if (params.toString()) {
            endpoint += '?' + params.toString();
        }
        
        return this.request(endpoint);
    }
    
    static async getSettings() {
        return this.request('admin/get_settings.php');
    }
    
    static async updateSettings(settings) {
        return this.request('admin/update_settings.php', {
            method: 'PUT',
            body: { settings: settings }
        });
    }
    
    static async deleteUser(userId) {
        return this.request('admin/delete_user.php', {
            method: 'DELETE',
            body: { user_id: userId }
        });
    }
    
    static async sendMessageToProducer(messageData) {
        return this.request('admin/send_message_to_producer.php', {
            method: 'POST',
            body: messageData
        });
    }
    
    static async sendMessage(messageData) {
        return this.request('user/send_message.php', {
            method: 'POST',
            body: messageData
        });
    }
    
    static async getReceivedMessages(recipientId, isRead = null) {
        let endpoint = `user/get_received_messages.php?recipient_id=${recipientId}`;
        if (isRead !== null) {
            endpoint += `&is_read=${isRead}`;
        }
        return this.request(endpoint);
    }
    
    static async getConversationMessages(user1Id, user2Id) {
        return this.request(`user/get_conversation_messages.php?user1_id=${user1Id}&user2_id=${user2Id}`);
    }
    
    static async createMessage(messageData) {
        return this.request('admin/create_message.php', {
            method: 'POST',
            body: messageData
        });
    }
    
    static async markMessageRead(messageId) {
        return this.request('admin/mark_message_read.php', {
            method: 'PUT',
            body: { message_id: messageId }
        });
    }
    
    // ========== MOT DE PASSE OUBLIÉ ==========
    
    static async forgotPassword(email) {
        return this.request('auth/forgot_password.php', {
            method: 'POST',
            body: { email: email }
        });
    }
    
    static async resetPassword(resetData) {
        return this.request('auth/reset_password.php', {
            method: 'POST',
            body: resetData
        });
    }
}

// Exporter pour utilisation globale
if (typeof window !== 'undefined') {
    window.AgriConnectAPI = AgriConnectAPI;
}
