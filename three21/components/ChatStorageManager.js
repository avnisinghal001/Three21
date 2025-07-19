import { openDB } from 'idb';

/**
 * Chat Storage Manager for persistent model-specific conversations
 * Uses IndexedDB to store chats locally per model
 */
class ChatStorageManager {
    constructor() {
        this.dbName = 'Three21ChatDB';
        this.dbVersion = 1;
        this.storeName = 'modelChats';
        this.db = null;
    }

    /**
     * Initialize the database
     */
    async init() {
        if (this.db) return this.db;

        try {
            this.db = await openDB(this.dbName, this.dbVersion, {
                upgrade(db) {
                    if (!db.objectStoreNames.contains('modelChats')) {
                        const store = db.createObjectStore('modelChats', { 
                            keyPath: 'modelId' 
                        });
                        store.createIndex('filename', 'filename', { unique: false });
                        store.createIndex('lastAccess', 'lastAccess', { unique: false });
                    }
                },
            });
            console.log('ChatStorageManager: Database initialized');
            return this.db;
        } catch (error) {
            console.error('ChatStorageManager: Failed to initialize database:', error);
            throw error;
        }
    }

    /**
     * Generate unique model ID from model info
     */
    generateModelId(modelInfo) {
        if (!modelInfo) return 'unknown-model';
        
        // Create a unique ID based on filename, size, and other identifying info
        const components = [
            modelInfo.filename || 'unnamed',
            modelInfo.fileSize || 0,
            modelInfo.type || 'unknown',
            modelInfo.description || ''
        ];
        
        // Create a simple hash
        const hashInput = components.join('|');
        let hash = 0;
        for (let i = 0; i < hashInput.length; i++) {
            const char = hashInput.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return `model_${Math.abs(hash)}`;
    }

    /**
     * Save chat messages for a specific model
     */
    async saveChatForModel(modelInfo, messages) {
        try {
            await this.init();
            const modelId = this.generateModelId(modelInfo);
            
            const chatData = {
                modelId,
                filename: modelInfo?.filename || 'Unknown Model',
                modelInfo,
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    originalQuery: msg.originalQuery || msg.content,
                    timestamp: msg.timestamp || Date.now(),
                    hasScreenshot: msg.hasScreenshot || false
                })),
                lastAccess: Date.now(),
                createdAt: Date.now()
            };

            await this.db.put(this.storeName, chatData);
            console.log(`ChatStorageManager: Saved chat for model ${modelId}`);
            return modelId;
        } catch (error) {
            console.error('ChatStorageManager: Failed to save chat:', error);
            throw error;
        }
    }

    /**
     * Load chat messages for a specific model
     */
    async loadChatForModel(modelInfo) {
        try {
            await this.init();
            const modelId = this.generateModelId(modelInfo);
            
            const chatData = await this.db.get(this.storeName, modelId);
            
            if (chatData) {
                // Update last access time
                chatData.lastAccess = Date.now();
                await this.db.put(this.storeName, chatData);
                
                console.log(`ChatStorageManager: Loaded chat for model ${modelId}`);
                return chatData.messages || [];
            }
            
            console.log(`ChatStorageManager: No existing chat found for model ${modelId}`);
            return [];
        } catch (error) {
            console.error('ChatStorageManager: Failed to load chat:', error);
            return [];
        }
    }

    /**
     * Clear chat for a specific model
     */
    async clearChatForModel(modelInfo) {
        try {
            await this.init();
            const modelId = this.generateModelId(modelInfo);
            
            await this.db.delete(this.storeName, modelId);
            console.log(`ChatStorageManager: Cleared chat for model ${modelId}`);
            return true;
        } catch (error) {
            console.error('ChatStorageManager: Failed to clear chat:', error);
            return false;
        }
    }

    /**
     * Get all stored model chats
     */
    async getAllModelChats() {
        try {
            await this.init();
            const allChats = await this.db.getAll(this.storeName);
            
            return allChats.map(chat => ({
                modelId: chat.modelId,
                filename: chat.filename,
                lastAccess: chat.lastAccess,
                messageCount: chat.messages?.length || 0,
                createdAt: chat.createdAt
            }));
        } catch (error) {
            console.error('ChatStorageManager: Failed to get all chats:', error);
            return [];
        }
    }

    /**
     * Clean up old chats (older than 30 days)
     */
    async cleanupOldChats() {
        try {
            await this.init();
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            
            const allChats = await this.db.getAll(this.storeName);
            let cleanedCount = 0;
            
            for (const chat of allChats) {
                if (chat.lastAccess < thirtyDaysAgo) {
                    await this.db.delete(this.storeName, chat.modelId);
                    cleanedCount++;
                }
            }
            
            console.log(`ChatStorageManager: Cleaned up ${cleanedCount} old chats`);
            return cleanedCount;
        } catch (error) {
            console.error('ChatStorageManager: Failed to cleanup old chats:', error);
            return 0;
        }
    }

    /**
     * Get storage usage statistics
     */
    async getStorageStats() {
        try {
            await this.init();
            const allChats = await this.db.getAll(this.storeName);
            
            let totalSize = 0;
            let totalMessages = 0;
            
            for (const chat of allChats) {
                totalMessages += chat.messages?.length || 0;
                totalSize += JSON.stringify(chat).length;
            }
            
            return {
                totalChats: allChats.length,
                totalMessages,
                estimatedSizeKB: Math.round(totalSize / 1024),
                oldestChat: allChats.reduce((oldest, chat) => 
                    (!oldest || chat.createdAt < oldest.createdAt) ? chat : oldest, null
                )
            };
        } catch (error) {
            console.error('ChatStorageManager: Failed to get storage stats:', error);
            return null;
        }
    }
}

// Singleton instance
const chatStorageManager = new ChatStorageManager();

export default chatStorageManager;
